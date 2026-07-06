import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  getConversationAccess,
  getMessages,
  getParticipantsState,
  setLastRead,
  shapeMessage,
} from "@/lib/messages";
import { ChatWindow } from "@/components/chat-window";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = (await getCurrentUser())!;

  const access = await getConversationAccess(id, me.id);
  if (!access) notFound();

  const [raw, participants] = await Promise.all([
    getMessages(id),
    getParticipantsState(id),
    setLastRead(id, me.id),
  ]);

  const title = access.convo.isGroup
    ? (access.convo.title ?? "Беседа")
    : (access.other?.displayName ?? "Диалог");

  const headerUser = access.other
    ? {
        username: access.other.username,
        displayName: access.other.displayName,
        avatarUrl: access.other.avatarUrl,
      }
    : null;

  return (
    <ChatWindow
      conversationId={id}
      meId={me.id}
      isGroup={access.convo.isGroup}
      title={title}
      groupAvatar={access.convo.avatarUrl}
      headerUser={headerUser}
      initialMessages={raw.map((m) => shapeMessage(m, me.id))}
      initialParticipants={participants}
    />
  );
}
