import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/friends";

// Текущий пользователь из БД. cache() дедуплицирует вызовы в рамках запроса.
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: publicUserSelect,
  });
});
