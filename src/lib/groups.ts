import { prisma } from "@/lib/prisma";
import type { GroupRole } from "@prisma/client";

export const publicGroupSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  avatarUrl: true,
  createdAt: true,
} as const;

/** Генерирует slug из названия + случайный суффикс для уникальности. */
export function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `group-${suffix}`;
}

/** Все сообщества с числом участников. */
export async function getGroups() {
  const groups = await prisma.group.findMany({
    select: {
      ...publicGroupSelect,
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return groups.map((g) => ({ ...g, memberCount: g._count.members }));
}

/** Сообщество по slug + число участников. */
export async function getGroup(slug: string) {
  const group = await prisma.group.findUnique({
    where: { slug },
    select: {
      ...publicGroupSelect,
      ownerId: true,
      _count: { select: { members: true } },
    },
  });
  if (!group) return null;
  return { ...group, memberCount: group._count.members };
}

/** Роль пользователя в сообществе (или null, если не участник). */
export async function getMembership(
  groupId: string,
  userId: string,
): Promise<GroupRole | null> {
  const m = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

/** ID сообществ, в которых состоит пользователь (для ленты). */
export async function getUserGroupIds(userId: string): Promise<string[]> {
  const memberships = await prisma.groupMembership.findMany({
    where: { userId },
    select: { groupId: true },
  });
  return memberships.map((m) => m.groupId);
}
