"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { makeSlug } from "@/lib/groups";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

const groupSchema = z.object({
  name: z.string().trim().min(3, "Минимум 3 символа").max(60),
  description: z.string().trim().max(300).nullish(),
});

export type GroupActionState = { error?: string };

/** Создать сообщество. Создатель становится владельцем. */
export async function createGroup(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const userId = await requireUserId();
  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ошибка" };
  }

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      slug: makeSlug(parsed.data.name),
      ownerId: userId,
      members: { create: { userId, role: "OWNER" } },
    },
    select: { slug: true },
  });

  redirect(`/groups/${group.slug}`);
}

/** Вступить в сообщество. */
export async function joinGroup(groupId: string) {
  const userId = await requireUserId();
  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId, userId } },
    update: {},
    create: { groupId, userId, role: "MEMBER" },
  });
  revalidatePath("/groups");
}

/** Выйти из сообщества (владелец выйти не может). */
export async function leaveGroup(groupId: string) {
  const userId = await requireUserId();
  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership || membership.role === "OWNER") return;

  await prisma.groupMembership.delete({ where: { id: membership.id } });
  revalidatePath("/groups");
}
