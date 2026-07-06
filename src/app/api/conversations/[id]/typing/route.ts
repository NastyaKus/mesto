import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getConversationAccess, touchTyping } from "@/lib/messages";

// Сигнал «я печатаю» в беседе — клиент шлёт при вводе (дебаунс на стороне клиента).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { id } = await params;
  const access = await getConversationAccess(id, session.user.id);
  if (!access) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  await touchTyping(id, session.user.id);
  return NextResponse.json({ ok: true });
}
