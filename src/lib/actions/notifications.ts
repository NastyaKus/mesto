"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { markAllNotificationsRead } from "@/lib/notifications";

/** Помечает все уведомления текущего пользователя прочитанными. */
export async function markNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return;
  await markAllNotificationsRead(session.user.id);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
