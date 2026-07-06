import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getConversationAccess,
  getMessages,
  getParticipantsState,
  setLastRead,
  shapeMessage,
} from "@/lib/messages";

// Поллинг беседы: GET ...?after=<ISO-время>.
// Отдаём одним ответом новые сообщения + состояние участников
// (прочтение / «печатает» / онлайн), чтобы не плодить лишние запросы.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;
  const access = await getConversationAccess(id, userId);
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const afterParam = new URL(req.url).searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : undefined;

  const [raw, participants] = await Promise.all([
    getMessages(id, after),
    getParticipantsState(id),
  ]);
  // Открытие/опрос беседы двигает отметку прочтения.
  await setLastRead(id, userId);

  return NextResponse.json({
    messages: raw.map((m) => shapeMessage(m, userId)),
    participants,
  });
}
