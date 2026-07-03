import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getConversationWith, getMessages, markRead } from "@/lib/messages";
import { ChatWindow } from "@/components/chat-window";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = (await getCurrentUser())!;

  const access = await getConversationWith(id, me.id);
  if (!access) notFound();

  const [messages] = await Promise.all([
    getMessages(id),
    markRead(id, me.id),
  ]);

  const serialized = messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <ChatWindow
      conversationId={id}
      meId={me.id}
      other={access.other}
      initialMessages={serialized}
    />
  );
}
