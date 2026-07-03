"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createNotification } from "@/lib/notifications";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

/** Отправить заявку в друзья. */
export async function sendFriendRequest(targetId: string) {
  const userId = await requireUserId();
  if (userId === targetId) return;

  // Проверяем, нет ли уже связи в любую сторону.
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: targetId },
        { requesterId: targetId, addresseeId: userId },
      ],
    },
  });

  if (existing) {
    // Если ранее заявку отклоняли — переоткрываем как новую от меня.
    if (existing.status === "DECLINED") {
      await prisma.friendship.update({
        where: { id: existing.id },
        data: { requesterId: userId, addresseeId: targetId, status: "PENDING" },
      });
    }
    // Во всех прочих случаях (PENDING/ACCEPTED/BLOCKED) ничего не делаем.
  } else {
    await prisma.friendship.create({
      data: { requesterId: userId, addresseeId: targetId, status: "PENDING" },
    });
  }

  await createNotification({
    userId: targetId,
    actorId: userId,
    type: "FRIEND_REQUEST",
  });

  revalidatePath("/friends");
  revalidatePath("/profile");
}

/** Принять входящую заявку. */
export async function acceptFriendRequest(requesterId: string) {
  const userId = await requireUserId();
  const updated = await prisma.friendship.updateMany({
    where: { requesterId, addresseeId: userId, status: "PENDING" },
    data: { status: "ACCEPTED" },
  });

  if (updated.count > 0) {
    await createNotification({
      userId: requesterId,
      actorId: userId,
      type: "FRIEND_ACCEPT",
    });
  }

  revalidatePath("/friends");
  revalidatePath("/profile");
}

/** Отклонить входящую заявку. */
export async function declineFriendRequest(requesterId: string) {
  const userId = await requireUserId();
  await prisma.friendship.updateMany({
    where: { requesterId, addresseeId: userId, status: "PENDING" },
    data: { status: "DECLINED" },
  });
  revalidatePath("/friends");
  revalidatePath("/profile");
}

/** Удалить из друзей или отменить исходящую заявку. */
export async function removeFriend(otherId: string) {
  const userId = await requireUserId();
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: userId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: userId },
      ],
    },
  });
  revalidatePath("/friends");
  revalidatePath("/profile");
}
