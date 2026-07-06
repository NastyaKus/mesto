import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getConversations } from "@/lib/messages";
import { Avatar } from "@/components/ui/avatar";
import { PinButton } from "@/components/pin-button";
import { timeAgo } from "@/lib/format";

export default async function MessagesPage() {
  const me = (await getCurrentUser())!;
  const conversations = await getConversations(me.id);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Сообщения</h1>
        <Link href="/messages/new" className="btn-primary px-4 py-1.5 text-sm">
          Новая беседа
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-3xl">✉️</p>
          <p className="mt-2 font-medium">Пока нет диалогов</p>
          <p className="mt-1 text-sm text-muted">
            Откройте профиль друга и нажмите «Написать», или создайте беседу.
          </p>
        </div>
      ) : (
        <div className="stagger flex flex-col gap-2">
          {conversations.map((c) => (
            <div key={c.id} className="group relative">
              <PinButton conversationId={c.id} pinned={c.pinned} />
              <Link
                href={`/messages/${c.id}`}
                className="card hover-lift flex items-center gap-3 p-3"
              >
              <Avatar
                src={c.avatarUrl}
                name={c.title}
                size={48}
                online={c.isGroup ? undefined : c.online}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium">
                    {c.pinned && <span className="shrink-0 text-brand">📌</span>}
                    {c.isGroup && <span className="shrink-0 text-muted">👥</span>}
                    <span className="truncate">{c.title}</span>
                  </span>
                  {c.lastMessage && (
                    <span className="shrink-0 pr-6 text-xs text-muted">
                      {timeAgo(c.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-muted">
                    {c.lastMessage
                      ? (c.lastMessage.senderId === me.id ? "Вы: " : "") +
                        (c.lastMessage.content || "📷 Фото")
                      : c.isGroup
                        ? `${c.participantCount} участников`
                        : "Нет сообщений"}
                  </span>
                  {c.unread > 0 && (
                    <span className="bg-brand-gradient min-w-5 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
