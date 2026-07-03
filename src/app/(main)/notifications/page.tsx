import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getNotifications } from "@/lib/notifications";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";
import { MarkReadOnMount } from "@/components/mark-read-on-mount";
import type { NotificationType } from "@prisma/client";

const TEXT: Record<NotificationType, string> = {
  FRIEND_REQUEST: "отправил(а) заявку в друзья",
  FRIEND_ACCEPT: "принял(а) вашу заявку в друзья",
  POST_LIKE: "оценил(а) вашу запись",
  POST_COMMENT: "прокомментировал(а) вашу запись",
};

const ICON: Record<NotificationType, string> = {
  FRIEND_REQUEST: "👤",
  FRIEND_ACCEPT: "🤝",
  POST_LIKE: "❤️",
  POST_COMMENT: "💬",
};

function linkFor(type: NotificationType, username: string): string {
  if (type === "POST_LIKE" || type === "POST_COMMENT") return "/feed";
  return `/profile/${username}`;
}

export default async function NotificationsPage() {
  const me = (await getCurrentUser())!;
  const notifications = await getNotifications(me.id);

  return (
    <div>
      <MarkReadOnMount />
      <h1 className="mb-4 text-lg font-semibold">Уведомления</h1>
      {notifications.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-3xl">🔔</p>
          <p className="mt-2 font-medium">Пока пусто</p>
          <p className="mt-1 text-sm text-muted">
            Здесь появятся заявки в друзья, лайки и комментарии к вашим записям.
          </p>
        </div>
      ) : (
        <div className="stagger flex flex-col gap-2">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={linkFor(n.type, n.actor.username)}
              className={`card flex items-center gap-3 p-3 transition-transform hover:-translate-y-0.5 ${
                n.read ? "" : "border-l-4 border-l-brand"
              }`}
            >
              <div className="relative">
                <Avatar
                  src={n.actor.avatarUrl}
                  name={n.actor.displayName}
                  size={44}
                />
                <span className="absolute -right-1 -bottom-1 text-sm">
                  {ICON[n.type]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-medium">{n.actor.displayName}</span>{" "}
                <span className="text-muted">{TEXT[n.type]}</span>
                <div className="text-xs text-muted">
                  {timeAgo(n.createdAt)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
