import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/friends";
import { getBearerUserId, json, unauthorized, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// GET /api/v1/me → текущий пользователь
export async function GET(req: Request) {
  const userId = await getBearerUserId(req);
  if (!userId) return unauthorized();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) return unauthorized();
  return json({ user });
}
