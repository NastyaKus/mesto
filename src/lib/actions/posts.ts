"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createNotification } from "@/lib/notifications";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

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

  await prisma.post.create({
    data: {
      authorId: userId,
      groupId,
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl || null,
    },
  });

  revalidatePath("/feed");
  revalidatePath("/profile", "layout");
  if (groupId) revalidatePath("/groups", "layout");
  return {};
}

/** Удалить свой пост. */
export async function deletePost(postId: string) {
  const userId = await requireUserId();
  await prisma.post.deleteMany({ where: { id: postId, authorId: userId } });
  revalidatePath("/feed");
  revalidatePath("/profile", "layout");
}

/** Поставить/снять лайк. */
export async function toggleLike(postId: string) {
  const userId = await requireUserId();
  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { postId, userId } });
    // Уведомляем автора поста только при постановке лайка.
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

  revalidatePath("/feed");
  revalidatePath("/profile", "layout");
}

/** Добавить комментарий. */
export async function addComment(postId: string, content: string) {
  const userId = await requireUserId();
  const text = content.trim();
  if (!text) return;

  const comment = await prisma.comment.create({
    data: { postId, authorId: userId, content: text.slice(0, 1000) },
    include: { post: { select: { authorId: true } } },
  });

  await createNotification({
    userId: comment.post.authorId,
    actorId: userId,
    type: "POST_COMMENT",
    entityId: postId,
  });

  revalidatePath("/feed");
  revalidatePath("/profile", "layout");
}
