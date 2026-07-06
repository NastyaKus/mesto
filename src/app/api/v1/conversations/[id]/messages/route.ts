import { createMessage } from "@/lib/messages";
import { getBearerUserId, json, unauthorized, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// POST /api/v1/conversations/:id/messages { content, imageUrl?, replyToId? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getBearerUserId(req);
  if (!userId) return unauthorized();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    content?: string;
    imageUrl?: string;
    replyToId?: string;
  };

  const message = await createMessage(
    userId,
    id,
    body.content ?? "",
    body.imageUrl,
    body.replyToId,
  );
  if (!message) return json({ error: "Не удалось отправить" }, { status: 400 });
  return json({ ok: true, id: message.id });
}
