import { createUserPost, getPostById } from "@/lib/posts";
import { getBearerUserId, json, unauthorized, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// POST /api/v1/posts { content, imageUrl? } → созданный пост
export async function POST(req: Request) {
  const userId = await getBearerUserId(req);
  if (!userId) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as {
    content?: string;
    imageUrl?: string;
  };
  const content = (body.content ?? "").trim();
  if (!content) return json({ error: "Напишите что-нибудь" }, { status: 400 });

  const id = await createUserPost(userId, content, body.imageUrl);
  if (!id) return json({ error: "Не удалось создать пост" }, { status: 400 });
  const post = await getPostById(id, userId);
  return json({ post });
}
