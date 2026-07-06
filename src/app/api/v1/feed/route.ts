import { getFeedPosts } from "@/lib/posts";
import { getBearerUserId, json, unauthorized, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// GET /api/v1/feed → лента постов
export async function GET(req: Request) {
  const userId = await getBearerUserId(req);
  if (!userId) return unauthorized();
  const posts = await getFeedPosts(userId);
  return json({ posts });
}
