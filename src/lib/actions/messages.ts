"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  getOrCreateConversation,
  getConversationWith,
} from "@/lib/messages";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

/** Открыть (или создать) диалог с пользователем и перейти в него. */
export async function startConversation(otherId: string) {
  const userId = await requireUserId();
  if (userId === otherId) return;
  const id = await getOrCreateConversation(userId, otherId);
  redirect(`/messages/${id}`);
}

/** Отправить сообщение в диалог. */
export async function sendMessage(conversationId: string, content: string) {
  const userId = await requireUserId();
  const text = content.trim();
  if (!text) return;

  // Убеждаемся, что отправитель — участник диалога.
  const access = await getConversationWith(conversationId, userId);
  if (!access) throw new Error("Нет доступа к диалогу");

  const now = new Date();
  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: userId, content: text.slice(0, 2000) },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    }),
  ]);

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
}
