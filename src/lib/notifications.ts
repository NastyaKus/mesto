import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/friends";
import type { NotificationType } from "@prisma/client";

/** Создаёт уведомление. Себе уведомления не шлём. */
export async function createNotification(params: {
  userId: string; // получатель
  actorId: string; // кто совершил действие
  type: NotificationType;
  entityId?: string;
}) {
  if (params.userId === params.actorId) return;
  await prisma.notification.create({
    data: {
      userId: params.userId,
      actorId: params.actorId,
      type: params.type,
      entityId: params.entityId ?? null,
    },
  });
}

/** Список уведомлений пользователя (свежие сверху). */
export function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    include: { actor: { select: publicUserSelect } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/** Число непрочитанных — для бейджа. */
export function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

/** Пометить все уведомления прочитанными. */
export function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
