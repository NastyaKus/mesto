import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/friends";

// «В сети» — активность за последние 2 минуты; «печатает» — сигнал за 5 секунд.
const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const TYPING_WINDOW_MS = 5 * 1000;

export function isOnline(lastSeenAt: Date | string | null): boolean {
  if (!lastSeenAt) return false;
  const t = typeof lastSeenAt === "string" ? Date.parse(lastSeenAt) : lastSeenAt.getTime();
  return Date.now() - t < ONLINE_WINDOW_MS;
}

export function isTyping(lastTypingAt: Date | string | null): boolean {
  if (!lastTypingAt) return false;
  const t = typeof lastTypingAt === "string" ? Date.parse(lastTypingAt) : lastTypingAt.getTime();
  return Date.now() - t < TYPING_WINDOW_MS;
}

/** Находит или создаёт личный (не групповой) диалог между двумя пользователями. */
export async function getOrCreateConversation(
  meId: string,
  otherId: string,
): Promise<string> {
  // Личная беседа ровно с этими двумя участниками (без третьих лиц).
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      participants: { every: { userId: { in: [meId, otherId] } } },
      AND: [
        { participants: { some: { userId: meId } } },
        { participants: { some: { userId: otherId } } },
      ],
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const convo = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: { create: [{ userId: meId }, { userId: otherId }] },
    },
    select: { id: true },
  });
  return convo.id;
}

/** Создаёт групповую беседу; создатель — владелец (OWNER). Возвращает id. */
export async function createGroupConversation(
  ownerId: string,
  title: string,
  memberIds: string[],
): Promise<string> {
  const ids = Array.from(new Set([ownerId, ...memberIds]));
  const convo = await prisma.conversation.create({
    data: {
      isGroup: true,
      title: title.slice(0, 60),
      ownerId,
      participants: {
        create: ids.map((userId) => ({
          userId,
          role: userId === ownerId ? "OWNER" : "MEMBER",
        })),
      },
    },
    select: { id: true },
  });
  return convo.id;
}

// «Шапка» диалога для списка сообщений.
export type ConversationSummary = {
  id: string;
  isGroup: boolean;
  title: string;
  avatarUrl: string | null;
  other: { username: string; displayName: string; avatarUrl: string | null } | null;
  online: boolean;
  participantCount: number;
  lastMessage: { senderId: string; content: string; imageUrl: string | null; createdAt: Date } | null;
  unread: number;
};

/** Список бесед пользователя (личных и групповых) с последним сообщением и непрочитанными. */
export async function getConversations(
  userId: string,
): Promise<ConversationSummary[]> {
  const convos = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: { include: { user: { select: publicUserSelect } } },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return Promise.all(
    convos.map(async (c) => {
      const me = c.participants.find((p) => p.userId === userId);
      const others = c.participants.filter((p) => p.userId !== userId);
      const other = c.isGroup ? null : (others[0]?.user ?? null);

      const unread = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          deletedAt: null,
          ...(me?.lastReadAt ? { createdAt: { gt: me.lastReadAt } } : {}),
        },
      });

      return {
        id: c.id,
        isGroup: c.isGroup,
        title: c.isGroup ? (c.title ?? "Беседа") : (other?.displayName ?? "Диалог"),
        avatarUrl: c.isGroup ? c.avatarUrl : (other?.avatarUrl ?? null),
        other: other
          ? {
              username: other.username,
              displayName: other.displayName,
              avatarUrl: other.avatarUrl,
            }
          : null,
        online: other ? isOnline(other.lastSeenAt) : false,
        participantCount: c.participants.length,
        lastMessage: c.messages[0]
          ? {
              senderId: c.messages[0].senderId,
              content: c.messages[0].content,
              imageUrl: c.messages[0].imageUrl,
              createdAt: c.messages[0].createdAt,
            }
          : null,
        unread,
      };
    }),
  );
}

/** Проверяет участие пользователя в беседе; возвращает беседу, участников и (для DM) собеседника. */
export async function getConversationAccess(
  conversationId: string,
  userId: string,
) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: { include: { user: { select: publicUserSelect } } } },
  });
  if (!convo) return null;
  const me = convo.participants.find((p) => p.userId === userId);
  if (!me) return null;
  const others = convo.participants.filter((p) => p.userId !== userId);
  return {
    convo,
    me,
    others,
    other: convo.isGroup ? null : (others[0]?.user ?? null),
  };
}

// Как загружаем сообщение со связями (реакции + цитируемое сообщение).
const messageInclude = {
  reactions: { select: { emoji: true, userId: true } },
  replyTo: {
    select: {
      id: true,
      content: true,
      deletedAt: true,
      sender: { select: { displayName: true } },
    },
  },
} as const;

/** Сообщения беседы (по возрастанию времени). */
export function getMessages(conversationId: string, after?: Date) {
  return prisma.message.findMany({
    where: {
      conversationId,
      ...(after ? { createdAt: { gt: after } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: messageInclude,
  });
}

// Форма сообщения для клиента.
export type ChatMessage = {
  id: string;
  senderId: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  reactions: { emoji: string; count: number }[];
  myReaction: string | null;
  replyTo: { id: string; author: string; preview: string } | null;
};

type RawMessage = Awaited<ReturnType<typeof getMessages>>[number];

/** Приводит сообщение из БД к сериализуемой форме для чата. */
export function shapeMessage(m: RawMessage, viewerId: string): ChatMessage {
  const counts = new Map<string, number>();
  for (const r of m.reactions) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  const reactions = [...counts.entries()]
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count);
  const myReaction = m.reactions.find((r) => r.userId === viewerId)?.emoji ?? null;

  const deleted = m.deletedAt !== null;
  const replyTo = m.replyTo
    ? {
        id: m.replyTo.id,
        author: m.replyTo.sender.displayName,
        preview: m.replyTo.deletedAt
          ? "удалённое сообщение"
          : m.replyTo.content.slice(0, 80) || "📷 Фото",
      }
    : null;

  return {
    id: m.id,
    senderId: m.senderId,
    // Содержимое удалённого сообщения клиенту не отдаём.
    content: deleted ? "" : m.content,
    imageUrl: deleted ? null : m.imageUrl,
    createdAt: m.createdAt.toISOString(),
    editedAt: m.editedAt ? m.editedAt.toISOString() : null,
    deleted,
    reactions: deleted ? [] : reactions,
    myReaction: deleted ? null : myReaction,
    replyTo,
  };
}

/** Помечает беседу прочитанной для пользователя (двигает lastReadAt). */
export function setLastRead(conversationId: string, userId: string) {
  return prisma.conversationParticipant.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  });
}

/** Отмечает, что пользователь печатает в беседе (для индикатора «печатает…»). */
export function touchTyping(conversationId: string, userId: string) {
  return prisma.conversationParticipant.updateMany({
    where: { conversationId, userId },
    data: { lastTypingAt: new Date() },
  });
}

// Состояние участников для поллинга: личность + прочтение, набор текста, онлайн.
export type ParticipantState = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastReadAt: string | null;
  lastSeenAt: string | null;
  typing: boolean;
  online: boolean;
};

/** Состояние всех участников беседы — отдаётся вместе с поллингом сообщений. */
export async function getParticipantsState(
  conversationId: string,
): Promise<ParticipantState[]> {
  const parts = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: {
      userId: true,
      lastReadAt: true,
      lastTypingAt: true,
      user: {
        select: {
          username: true,
          displayName: true,
          avatarUrl: true,
          lastSeenAt: true,
        },
      },
    },
  });
  return parts.map((p) => ({
    userId: p.userId,
    username: p.user.username,
    displayName: p.user.displayName,
    avatarUrl: p.user.avatarUrl,
    lastReadAt: p.lastReadAt ? p.lastReadAt.toISOString() : null,
    lastSeenAt: p.user.lastSeenAt ? p.user.lastSeenAt.toISOString() : null,
    typing: isTyping(p.lastTypingAt),
    online: isOnline(p.user.lastSeenAt),
  }));
}

/** Всего непрочитанных сообщений у пользователя — для бейджа в навигации. */
export async function countUnread(userId: string): Promise<number> {
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  if (parts.length === 0) return 0;

  const counts = await Promise.all(
    parts.map((p) =>
      prisma.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: userId },
          deletedAt: null,
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        },
      }),
    ),
  );
  return counts.reduce((sum, n) => sum + n, 0);
}
