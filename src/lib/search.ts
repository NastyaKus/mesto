import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/friends";

/** Поиск людей по имени или логину. */
export async function searchUsers(query: string, excludeId?: string) {
  const q = query.trim();
  if (!q) return [];
  return prisma.user.findMany({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [
        { displayName: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ],
    },
    select: publicUserSelect,
    take: 30,
    orderBy: { displayName: "asc" },
  });
}

export type MessageHit = {
  id: string;
  conversationId: string;
  content: string;
  createdAt: Date;
  sender: { displayName: string; avatarUrl: string | null };
  // Заголовок беседы для отображения в результатах.
  chatTitle: string;
};

/** Поиск по сообщениям в беседах, где зритель участвует. */
export async function searchMessages(
  query: string,
  viewerId: string,
): Promise<MessageHit[]> {
  const q = query.trim();
  if (!q) return [];
  const messages = await prisma.message.findMany({
    where: {
      deletedAt: null,
      content: { contains: q, mode: "insensitive" },
      conversation: { participants: { some: { userId: viewerId } } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      sender: { select: { displayName: true, avatarUrl: true } },
      conversation: {
        select: {
          isGroup: true,
          title: true,
          participants: {
            where: { userId: { not: viewerId } },
            select: { user: { select: { displayName: true } } },
          },
        },
      },
    },
  });

  return messages.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    content: m.content,
    createdAt: m.createdAt,
    sender: m.sender,
    chatTitle: m.conversation.isGroup
      ? (m.conversation.title ?? "Беседа")
      : (m.conversation.participants[0]?.user.displayName ?? "Диалог"),
  }));
}
