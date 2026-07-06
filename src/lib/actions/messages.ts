"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getFriends } from "@/lib/friends";
import {
  getOrCreateConversation,
  getConversationAccess,
  createGroupConversation,
} from "@/lib/messages";
import { sendPushToUser } from "@/lib/push";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

/** Открыть (или создать) личный диалог с пользователем и перейти в него. */
export async function startConversation(otherId: string) {
  const userId = await requireUserId();
  if (userId === otherId) return;
  const id = await getOrCreateConversation(userId, otherId);
  redirect(`/messages/${id}`);
}

/** Создать групповую беседу с выбранными друзьями и перейти в неё. */
export async function createGroupChat(title: string, memberIds: string[]) {
  const userId = await requireUserId();
  const clean = title.trim();
  if (!clean) return;

  // В беседу можно добавлять только своих друзей.
  const friends = await getFriends(userId);
  const friendIds = new Set(friends.map((f) => f.id));
  const members = memberIds.filter((id) => friendIds.has(id));
  if (members.length === 0) return;

  const id = await createGroupConversation(userId, clean, members);
  redirect(`/messages/${id}`);
}

/** Отправить сообщение в беседу (текст и/или картинка, опционально ответ-цитата). */
export async function sendMessage(
  conversationId: string,
  content: string,
  imageUrl?: string,
  replyToId?: string,
) {
  const userId = await requireUserId();
  const text = content.trim();
  const image = imageUrl?.trim() || null;
  if (!text && !image) return;

  const access = await getConversationAccess(conversationId, userId);
  if (!access) throw new Error("Нет доступа к диалогу");

  // Цитировать можно только сообщение из этой же беседы.
  let validReplyTo: string | null = null;
  if (replyToId) {
    const r = await prisma.message.findUnique({
      where: { id: replyToId },
      select: { conversationId: true },
    });
    if (r?.conversationId === conversationId) validReplyTo = replyToId;
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: text.slice(0, 2000),
        imageUrl: image,
        replyToId: validReplyTo,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    }),
    // Своё сообщение считаем прочитанным сразу.
    prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: now },
    }),
  ]);

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");

  // Веб-пуш остальным участникам (best-effort).
  const senderName = access.me.user.displayName;
  const groupTitle = access.convo.isGroup ? access.convo.title : null;
  const title = groupTitle ? `${senderName} · ${groupTitle}` : senderName;
  const body = text ? text.slice(0, 140) : "📷 Фото";
  await Promise.all(
    access.others.map((p) =>
      sendPushToUser(p.userId, {
        title,
        body,
        url: `/messages/${conversationId}`,
        tag: `conv-${conversationId}`,
      }),
    ),
  );
}

/** Поставить/снять/сменить реакцию на сообщение (одна реакция на пользователя). */
export async function setMessageReaction(messageId: string, emoji: string) {
  const userId = await requireUserId();
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: { conversationId: true, deletedAt: true },
  });
  if (!msg || msg.deletedAt) return;

  const access = await getConversationAccess(msg.conversationId, userId);
  if (!access) throw new Error("Нет доступа");

  const key = { messageId_userId: { messageId, userId } };
  const existing = await prisma.messageReaction.findUnique({ where: key });
  if (existing?.emoji === emoji) {
    await prisma.messageReaction.delete({ where: key });
  } else {
    await prisma.messageReaction.upsert({
      where: key,
      update: { emoji },
      create: { messageId, userId, emoji },
    });
  }
  revalidatePath(`/messages/${msg.conversationId}`);
}

/** Отредактировать своё сообщение. */
export async function editMessage(messageId: string, content: string) {
  const userId = await requireUserId();
  const text = content.trim();
  if (!text) return;

  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, conversationId: true, deletedAt: true },
  });
  if (!msg || msg.senderId !== userId || msg.deletedAt) return;

  await prisma.message.update({
    where: { id: messageId },
    data: { content: text.slice(0, 2000), editedAt: new Date() },
  });
  revalidatePath(`/messages/${msg.conversationId}`);
}

/** Удалить своё сообщение (мягко — остаётся плейсхолдер «сообщение удалено»). */
export async function deleteMessage(messageId: string) {
  const userId = await requireUserId();
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, conversationId: true },
  });
  if (!msg || msg.senderId !== userId) return;

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), imageUrl: null },
  });
  revalidatePath(`/messages/${msg.conversationId}`);
}

/** Добавить друзей в групповую беседу. */
export async function addParticipants(
  conversationId: string,
  userIds: string[],
) {
  const userId = await requireUserId();
  const access = await getConversationAccess(conversationId, userId);
  if (!access || !access.convo.isGroup) return;

  const friends = await getFriends(userId);
  const friendIds = new Set(friends.map((f) => f.id));
  const present = new Set(access.convo.participants.map((p) => p.userId));
  const toAdd = userIds.filter((id) => friendIds.has(id) && !present.has(id));
  if (toAdd.length === 0) return;

  await prisma.conversationParticipant.createMany({
    data: toAdd.map((uid) => ({ conversationId, userId: uid })),
    skipDuplicates: true,
  });
  revalidatePath(`/messages/${conversationId}`);
}

/** Переименовать групповую беседу (только владелец). */
export async function renameConversation(conversationId: string, title: string) {
  const userId = await requireUserId();
  const clean = title.trim();
  if (!clean) return;

  const access = await getConversationAccess(conversationId, userId);
  if (!access || !access.convo.isGroup || access.convo.ownerId !== userId) return;

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { title: clean.slice(0, 60) },
  });
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
}

/** Закрепить/открепить беседу (в списке зрителя). */
export async function togglePinConversation(conversationId: string) {
  const userId = await requireUserId();
  const part = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { id: true, pinnedAt: true },
  });
  if (!part) return;
  await prisma.conversationParticipant.update({
    where: { id: part.id },
    data: { pinnedAt: part.pinnedAt ? null : new Date() },
  });
  revalidatePath("/messages");
}

/** Выйти из беседы. */
export async function leaveConversation(conversationId: string) {
  const userId = await requireUserId();
  const access = await getConversationAccess(conversationId, userId);
  if (!access) return;

  await prisma.conversationParticipant.deleteMany({
    where: { conversationId, userId },
  });
  revalidatePath("/messages");
  redirect("/messages");
}
