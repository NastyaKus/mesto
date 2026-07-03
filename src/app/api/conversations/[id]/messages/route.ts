import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getConversationWith,
  getMessages,
  markRead,
} from "@/lib/messages";

// Поллинг новых сообщений диалога: GET ...?after=<ISO-время>.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getConversationWith(id, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const afterParam = new URL(req.url).searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : undefined;

  const messages = await getMessages(id, after);
  // Входящие сообщения помечаем прочитанными при опросе.
  await markRead(id, session.user.id);

  return NextResponse.json({ messages });
}
