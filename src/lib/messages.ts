import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/friends";

// Упорядочиваем пару id, чтобы диалог был единственным для двух людей.
function orderPair(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}

/** Находит или создаёт диалог между двумя пользователями. Возвращает id. */
export async function getOrCreateConversation(
  meId: string,
  otherId: string,
): Promise<string> {
  const [aId, bId] = orderPair(meId, otherId);
  const convo = await prisma.conversation.upsert({
    where: { aId_bId: { aId, bId } },
    update: {},
    create: { aId, bId },
    select: { id: true },
  });
  return convo.id;
}

/** Список диалогов пользователя с собеседником, последним сообщением и непрочитанными. */
export async function getConversations(userId: string) {
  const convos = await prisma.conversation.findMany({
    where: { OR: [{ aId: userId }, { bId: userId }] },
    include: {
      a: { select: publicUserSelect },
      b: { select: publicUserSelect },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const withUnread = await Promise.all(
    convos.map(async (c) => {
      const other = c.aId === userId ? c.b : c.a;
      const unread = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          readAt: null,
        },
      });
      return { id: c.id, other, lastMessage: c.messages[0] ?? null, unread };
    }),
  );

  return withUnread;
}

/** Проверяет, что пользователь — участник диалога, и возвращает собеседника. */
export async function getConversationWith(
  conversationId: string,
  userId: string,
) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      a: { select: publicUserSelect },
      b: { select: publicUserSelect },
    },
  });
  if (!convo || (convo.aId !== userId && convo.bId !== userId)) return null;
  return { convo, other: convo.aId === userId ? convo.b : convo.a };
}

/** Сообщения диалога (по возрастанию времени). */
export function getMessages(conversationId: string, after?: Date) {
  return prisma.message.findMany({
    where: {
      conversationId,
      ...(after ? { createdAt: { gt: after } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
}

/** Помечает входящие сообщения диалога прочитанными. */
export function markRead(conversationId: string, userId: string) {
  return prisma.message.updateMany({
    where: { conversationId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });
}

/** Всего непрочитанных сообщений у пользователя — для бейджа в сайдбаре. */
export function countUnread(userId: string) {
  return prisma.message.count({
    where: {
      senderId: { not: userId },
      readAt: null,
      conversation: { OR: [{ aId: userId }, { bId: userId }] },
    },
  });
}
