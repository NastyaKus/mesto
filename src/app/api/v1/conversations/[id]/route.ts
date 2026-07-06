import {
  getConversationAccess,
  getMessages,
  getParticipantsState,
  setLastRead,
  shapeMessage,
} from "@/lib/messages";
import { getBearerUserId, json, unauthorized, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// GET /api/v1/conversations/:id → сообщения + участники + шапка беседы
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getBearerUserId(req);
  if (!userId) return unauthorized();
  const { id } = await params;

  const access = await getConversationAccess(id, userId);
  if (!access) return json({ error: "Нет доступа" }, { status: 403 });

  const [raw, participants] = await Promise.all([
    getMessages(id),
    getParticipantsState(id),
  ]);
  await setLastRead(id, userId);

  return json({
    id,
    isGroup: access.convo.isGroup,
    title: access.convo.isGroup
      ? (access.convo.title ?? "Беседа")
      : (access.other?.displayName ?? "Диалог"),
    avatarUrl: access.convo.avatarUrl,
    other: access.other
      ? {
          username: access.other.username,
          displayName: access.other.displayName,
          avatarUrl: access.other.avatarUrl,
        }
      : null,
    messages: raw.map((m) => shapeMessage(m, userId)),
    participants,
  });
}
