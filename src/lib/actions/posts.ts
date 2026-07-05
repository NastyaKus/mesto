"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createNotification } from "@/lib/notifications";
import { extractMentions } from "@/lib/mentions";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

// Обновляем все места, где показываются посты.
function revalidatePosts() {
  revalidatePath("/feed");
  revalidatePath("/profile", "layout");
  revalidatePath("/groups", "layout");
}

// Шлём уведомления всем упомянутым через @username.
async function notifyMentions(text: string, actorId: string, entityId: string) {
  const usernames = extractMentions(text);
  if (usernames.length === 0) return;
  const users = await prisma.user.findMany({
    where: { username: { in: usernames } },
    select: { id: true },
  });
  await Promise.all(
    users.map((u) =>
      createNotification({
        userId: u.id,
        actorId,
        type: "MENTION",
        entityId,
      }),
    ),
  );
}

// Разрешённые эмодзи-реакции.
const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const postSchema = z.object({
  content: z.string().trim().min(1, "Напишите что-нибудь").max(2000),
  // Поле картинки может отсутствовать в форме → FormData.get даёт null.
  // .nullish() принимает и null, и undefined; пустую строку — тоже.
  // Разрешаем абсолютный URL (https://…) и относительный путь (/uploads/…).
  imageUrl: z
    .string()
    .refine((v) => /^(https?:\/\/|\/)/.test(v), "Некорректная ссылка")
    .or(z.literal(""))
    .nullish(),
  groupId: z.string().nullish(),
});

export type PostActionState = { error?: string };

/** Создать пост (личный или от лица сообщества). */
export async function createPost(
  _prev: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const userId = await requireUserId();
  const parsed = postSchema.safeParse({
    content: formData.get("content"),
    imageUrl: formData.get("imageUrl"),
    groupId: formData.get("groupId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ошибка" };
  }

  // Публикация от лица сообщества разрешена только владельцу/админу.
  let groupId: string | null = null;
  if (parsed.data.groupId) {
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: { groupId: parsed.data.groupId, userId },
      },
      select: { role: true },
    });
    if (!membership || membership.role === "MEMBER") {
      return { error: "Публиковать в сообщество может только администратор" };
    }
    groupId = parsed.data.groupId;
  }

  const post = await prisma.post.create({
    data: {
      authorId: userId,
      groupId,
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl || null,
    },
    select: { id: true },
  });

  await notifyMentions(parsed.data.content, userId, post.id);

  revalidatePosts();
  return {};
}

/** Редактировать свой пост. */
export async function editPost(postId: string, content: string) {
  const userId = await requireUserId();
  const text = content.trim();
  if (!text) return;
  await prisma.post.updateMany({
    where: { id: postId, authorId: userId },
    data: { content: text.slice(0, 2000), editedAt: new Date() },
  });
  revalidatePosts();
}

/** Удалить свой пост. */
export async function deletePost(postId: string) {
  const userId = await requireUserId();
  await prisma.post.deleteMany({ where: { id: postId, authorId: userId } });
  revalidatePosts();
}

/** Поставить/сменить/снять эмодзи-реакцию. */
export async function setReaction(postId: string, emoji: string) {
  const userId = await requireUserId();
  if (!REACTIONS.includes(emoji)) return;

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    if (existing.emoji === emoji) {
      // Повторный клик по той же реакции — снимаем.
      await prisma.like.delete({ where: { id: existing.id } });
    } else {
      await prisma.like.update({
        where: { id: existing.id },
        data: { emoji },
      });
    }
  } else {
    await prisma.like.create({ data: { postId, userId, emoji } });
    // Уведомляем автора только при первой реакции.
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (post) {
      await createNotification({
        userId: post.authorId,
        actorId: userId,
        type: "POST_LIKE",
        entityId: postId,
      });
    }
  }

  revalidatePosts();
}

/** Добавить комментарий (или ответ на другой комментарий). */
export async function addComment(
  postId: string,
  content: string,
  parentId?: string,
) {
  const userId = await requireUserId();
  const text = content.trim();
  if (!text) return;

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: userId,
      content: text.slice(0, 1000),
      parentId: parentId ?? null,
    },
    include: {
      post: { select: { authorId: true } },
      parent: { select: { authorId: true } },
    },
  });

  // Уведомляем автора поста.
  await createNotification({
    userId: comment.post.authorId,
    actorId: userId,
    type: "POST_COMMENT",
    entityId: postId,
  });
  // Если это ответ — уведомляем автора родительского комментария.
  if (comment.parent) {
    await createNotification({
      userId: comment.parent.authorId,
      actorId: userId,
      type: "COMMENT_REPLY",
      entityId: postId,
    });
  }
  await notifyMentions(text, userId, postId);

  revalidatePosts();
}

/** Редактировать свой комментарий. */
export async function editComment(commentId: string, content: string) {
  const userId = await requireUserId();
  const text = content.trim();
  if (!text) return;
  await prisma.comment.updateMany({
    where: { id: commentId, authorId: userId },
    data: { content: text.slice(0, 1000), editedAt: new Date() },
  });
  revalidatePosts();
}

/** Удалить свой комментарий. */
export async function deleteComment(commentId: string) {
  const userId = await requireUserId();
  await prisma.comment.deleteMany({ where: { id: commentId, authorId: userId } });
  revalidatePosts();
}
