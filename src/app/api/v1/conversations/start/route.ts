import { getOrCreateConversation } from "@/lib/messages";
import { getBearerUserId, json, unauthorized, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// POST /api/v1/conversations/start { otherId } → id личного диалога
export async function POST(req: Request) {
  const userId = await getBearerUserId(req);
  if (!userId) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as { otherId?: string };
  if (!body.otherId || body.otherId === userId) {
    return json({ error: "Некорректный собеседник" }, { status: 400 });
  }
  const id = await getOrCreateConversation(userId, body.otherId);
  return json({ id });
}
