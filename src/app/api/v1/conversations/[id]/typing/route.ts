import { getConversationAccess, touchTyping } from "@/lib/messages";
import { getBearerUserId, json, unauthorized, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// POST /api/v1/conversations/:id/typing → сигнал «печатаю»
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getBearerUserId(req);
  if (!userId) return unauthorized();
  const { id } = await params;
  const access = await getConversationAccess(id, userId);
  if (!access) return json({ error: "Нет доступа" }, { status: 403 });
  await touchTyping(id, userId);
  return json({ ok: true });
}
