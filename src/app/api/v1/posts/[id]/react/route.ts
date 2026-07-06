import { setPostReaction, getPostById } from "@/lib/posts";
import { getBearerUserId, json, unauthorized, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// POST /api/v1/posts/:id/react { emoji } → обновлённый пост
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getBearerUserId(req);
  if (!userId) return unauthorized();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { emoji?: string };
  if (!body.emoji) return json({ error: "Нет эмодзи" }, { status: 400 });

  await setPostReaction(userId, id, body.emoji);
  const post = await getPostById(id, userId);
  return json({ post });
}
