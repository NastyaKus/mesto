import { prisma } from "@/lib/prisma";
import { getBearerUserId, json, unauthorized, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// POST /api/v1/presence → обновить онлайн-статус
export async function POST(req: Request) {
  const userId = await getBearerUserId(req);
  if (!userId) return unauthorized();
  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  });
  return json({ ok: true });
}
