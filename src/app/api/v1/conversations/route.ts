import { getConversations } from "@/lib/messages";
import { getBearerUserId, json, unauthorized, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// GET /api/v1/conversations → список бесед
export async function GET(req: Request) {
  const userId = await getBearerUserId(req);
  if (!userId) return unauthorized();
  const conversations = await getConversations(userId);
  return json({ conversations });
}
