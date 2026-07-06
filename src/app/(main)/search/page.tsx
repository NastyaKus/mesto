import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getFriendState } from "@/lib/friends";
import { searchUsers, searchMessages } from "@/lib/search";
import { searchPosts } from "@/lib/posts";
import { Avatar } from "@/components/ui/avatar";
import { PostCard } from "@/components/post-card";
import { UserCard } from "@/components/user-card";
import { timeAgo } from "@/lib/format";

type Tab = "people" | "posts" | "messages";

// Подсветка совпадений подстроки (без внешних зависимостей).
function Highlight({ text, q }: { text: string; q: string }) {
  const query = q.trim();
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRe(query)})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="rounded bg-brand-gradient-soft px-0.5 text-brand">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const { q = "", tab } = await searchParams;
  const me = (await getCurrentUser())!;
  const query = q.trim();

  // По умолчанию: хэштег/пустой → записи, иначе люди.
  const activeTab: Tab =
    tab === "posts" || tab === "messages" || tab === "people"
      ? tab
      : query.startsWith("#")
        ? "posts"
        : "people";

  const [people, posts, messages] = query
    ? await Promise.all([
        searchUsers(query, me.id),
        searchPosts(query, me.id),
        searchMessages(query, me.id),
      ])
    : [[], [], []];

  // Состояние дружбы для каждого найденного человека (для кнопки в карточке).
  const peopleStates = await Promise.all(
    people.map((u) => getFriendState(me.id, u.id)),
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "people", label: "Люди", count: people.length },
    { key: "posts", label: "Записи", count: posts.length },
    { key: "messages", label: "Сообщения", count: messages.length },
  ];

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">
        {query ? (
          <>
            Поиск: <span className="text-brand">{query}</span>
          </>
        ) : (
          "Поиск"
        )}
      </h1>

      {!query ? (
        <div className="card p-8 text-center text-sm text-muted">
          Введите запрос в строке поиска сверху — найду людей, записи и сообщения.
        </div>
      ) : (
        <>
          {/* Вкладки */}
          <div className="mb-4 flex gap-2">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={`/search?q=${encodeURIComponent(query)}&tab=${t.key}`}
                className={`press rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  activeTab === t.key
                    ? "bg-brand-gradient text-white shadow-[var(--shadow-glow)]"
                    : "btn-ghost"
                }`}
              >
                {t.label}
                <span className="ml-1.5 opacity-70">{t.count}</span>
              </Link>
            ))}
          </div>

          {/* Люди */}
          {activeTab === "people" &&
            (people.length === 0 ? (
              <Empty />
            ) : (
              <div className="stagger flex flex-col gap-2">
                {people.map((u, idx) => (
                  <UserCard key={u.id} user={u} state={peopleStates[idx]} />
                ))}
              </div>
            ))}

          {/* Записи */}
          {activeTab === "posts" &&
            (posts.length === 0 ? (
              <Empty />
            ) : (
              <div className="stagger flex flex-col gap-4">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} meId={me.id} />
                ))}
              </div>
            ))}

          {/* Сообщения */}
          {activeTab === "messages" &&
            (messages.length === 0 ? (
              <Empty />
            ) : (
              <div className="stagger flex flex-col gap-2">
                {messages.map((m) => (
                  <Link
                    key={m.id}
                    href={`/messages/${m.conversationId}`}
                    className="card hover-lift flex items-start gap-3 p-3"
                  >
                    <Avatar
                      src={m.sender.avatarUrl}
                      name={m.sender.displayName}
                      size={40}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {m.chatTitle}
                        </span>
                        <span className="shrink-0 text-xs text-muted">
                          {timeAgo(m.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                        <span className="text-foreground">
                          {m.sender.displayName}:
                        </span>{" "}
                        <Highlight text={m.content} q={query} />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
        </>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="card p-8 text-center text-sm text-muted">
      Ничего не нашлось. Попробуйте другой запрос.
    </div>
  );
}
