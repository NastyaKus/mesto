import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getConversations } from "@/lib/messages";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";

export default async function MessagesPage() {
  const me = (await getCurrentUser())!;
  const conversations = await getConversations(me.id);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Сообщения</h1>
      {conversations.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-3xl">✉️</p>
          <p className="mt-2 font-medium">Пока нет диалогов</p>
          <p className="mt-1 text-sm text-muted">
            Откройте профиль друга и нажмите «Написать сообщение».
          </p>
        </div>
      ) : (
        <div className="stagger flex flex-col gap-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="card flex items-center gap-3 p-3 transition-transform hover:-translate-y-0.5"
            >
              <Avatar
                src={c.other.avatarUrl}
                name={c.other.displayName}
                size={48}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">
                    {c.other.displayName}
                  </span>
                  {c.lastMessage && (
                    <span className="shrink-0 text-xs text-muted">
                      {timeAgo(c.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-muted">
                    {c.lastMessage
                      ? (c.lastMessage.senderId === me.id ? "Вы: " : "") +
                        (c.lastMessage.content || "📷 Фото")
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
          ))}
        </div>
      )}
    </div>
  );
}
