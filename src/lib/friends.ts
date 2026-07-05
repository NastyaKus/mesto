import { prisma } from "@/lib/prisma";

// Состояние отношений между текущим пользователем и другим.
export type FriendState =
  | "SELF" // это мой собственный профиль
  | "NONE" // нет связи — можно добавить
  | "OUTGOING" // я отправил заявку, жду ответа
  | "INCOMING" // мне пришла заявка — можно принять/отклонить
  | "FRIENDS"; // мы друзья

// Публичные поля пользователя (без пароля).
export const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  coverUrl: true,
  bio: true,
  status: true,
  location: true,
  website: true,
  createdAt: true,
} as const;

/** Определяет отношения между viewer и target. */
export async function getFriendState(
  viewerId: string,
  targetId: string,
): Promise<FriendState> {
  if (viewerId === targetId) return "SELF";

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: viewerId, addresseeId: targetId },
        { requesterId: targetId, addresseeId: viewerId },
      ],
    },
  });

  if (!friendship) return "NONE";
  if (friendship.status === "ACCEPTED") return "FRIENDS";
  if (friendship.status === "PENDING") {
    return friendship.requesterId === viewerId ? "OUTGOING" : "INCOMING";
  }
  // DECLINED/BLOCKED трактуем как отсутствие связи для MVP.
  return "NONE";
}

/** Список подтверждённых друзей пользователя. */
export async function getFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { select: publicUserSelect },
      addressee: { select: publicUserSelect },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Возвращаем «второго» участника в каждой паре.
  return friendships.map((f) =>
    f.requesterId === userId ? f.addressee : f.requester,
  );
}

/** Входящие заявки в друзья (мне отправили, статус PENDING). */
export async function getIncomingRequests(userId: string) {
  const requests = await prisma.friendship.findMany({
    where: { addresseeId: userId, status: "PENDING" },
    include: { requester: { select: publicUserSelect } },
    orderBy: { createdAt: "desc" },
  });
  return requests.map((r) => r.requester);
}

/** Количество друзей — для счётчиков в профиле. */
export function countFriends(userId: string) {
  return prisma.friendship.count({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
  });
}

/** Рекомендации: люди, с которыми ещё нет никакой связи. */
export async function getFriendSuggestions(userId: string, take = 5) {
  const links = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: { requesterId: true, addresseeId: true },
  });
  const connected = new Set<string>([userId]);
  for (const l of links) {
    connected.add(l.requesterId);
    connected.add(l.addresseeId);
  }

  return prisma.user.findMany({
    where: { id: { notIn: [...connected] } },
    select: publicUserSelect,
    orderBy: { createdAt: "desc" },
    take,
  });
}
