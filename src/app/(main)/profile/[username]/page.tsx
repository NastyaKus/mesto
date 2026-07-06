import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  getFriendState,
  getFriends,
  countFriends,
  publicUserSelect,
} from "@/lib/friends";
import { getUserPosts, getPostById } from "@/lib/posts";
import { getUserGroups } from "@/lib/groups";
import { getActiveStoriesFeed } from "@/lib/stories";
import { isOnline } from "@/lib/messages";
import { presenceLabel } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Lightbox } from "@/components/ui/lightbox";
import { FriendButton } from "@/components/friend-button";
import { MessageButton } from "@/components/message-button";
import { PostComposer } from "@/components/post-composer";
import { PostCard } from "@/components/post-card";

type Tab = "posts" | "photos" | "friends" | "groups";

// Декоративные бейджи профиля (в отдельной функции — вне тела компонента).
function buildBadges(
  createdAt: Date | string,
  postsCount: number,
  ownedGroups: number,
): { icon: string; label: string }[] {
  const badges: { icon: string; label: string }[] = [];
  const daysOld = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  if (daysOld < 30) badges.push({ icon: "🌱", label: "новичок" });
  if (postsCount >= 3) badges.push({ icon: "✍️", label: "автор" });
  if (ownedGroups > 0) badges.push({ icon: "👑", label: "владелец сообщества" });
  return badges;
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const { tab } = await searchParams;
  const me = (await getCurrentUser())!;

  const profile = await prisma.user.findUnique({
    where: { username },
    select: {
      ...publicUserSelect,
      pinnedPostId: true,
      _count: { select: { posts: true, ownedGroups: true } },
    },
  });
  if (!profile) notFound();

  const [state, friendsCount, storyGroups] = await Promise.all([
    getFriendState(me.id, profile.id),
    countFriends(profile.id),
    getActiveStoriesFeed(me.id),
  ]);

  const isSelf = state === "SELF";
  const restricted = profile.isPrivate && !isSelf && state !== "FRIENDS";
  const storyGroup = storyGroups.find((g) => g.author.id === profile.id) ?? null;
  const online = isOnline(profile.lastSeenAt);

  // Общие друзья (для чужих профилей).
  let mutual = 0;
  if (!isSelf) {
    const [myFriends, theirFriends] = await Promise.all([
      getFriends(me.id),
      getFriends(profile.id),
    ]);
    const mine = new Set(myFriends.map((f) => f.id));
    mutual = theirFriends.filter((f) => mine.has(f.id)).length;
  }

  const activeTab: Tab =
    tab === "photos" || tab === "friends" || tab === "groups" ? tab : "posts";

  // Данные активной вкладки (только для доступного профиля).
  const posts =
    !restricted && (activeTab === "posts" || activeTab === "photos")
      ? await getUserPosts(profile.id, me.id)
      : [];
  const photos = posts.filter((p) => p.imageUrl).map((p) => p.imageUrl!);
  const friendsList =
    !restricted && activeTab === "friends" ? await getFriends(profile.id) : [];
  const groups =
    !restricted && activeTab === "groups" ? await getUserGroups(profile.id) : [];
  const pinnedPost =
    !restricted && activeTab === "posts" && profile.pinnedPostId
      ? await getPostById(profile.pinnedPostId, me.id)
      : null;
  const wall = pinnedPost
    ? posts.filter((p) => p.id !== pinnedPost.id)
    : posts;

  const joined = new Date(profile.createdAt).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  // Декоративные бейджи.
  const badges = buildBadges(
    profile.createdAt,
    profile._count.posts,
    profile._count.ownedGroups,
  );

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "posts", label: "Записи" },
    { key: "photos", label: "Фото" },
    { key: "friends", label: "Друзья", count: friendsCount },
    { key: "groups", label: "Сообщества" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Шапка профиля с обложкой */}
      <section className="card animate-fade-up overflow-hidden p-0">
        {profile.coverUrl ? (
          <Lightbox src={profile.coverUrl} className="h-40 w-full object-cover" />
        ) : (
          <div className="bg-brand-gradient h-40" />
        )}
        <div className="px-5 pb-5">
          <div className="-mt-12 flex flex-wrap items-end gap-4">
            <div className="rounded-full ring-4 ring-surface">
              <ProfileAvatar
                src={profile.avatarUrl}
                name={profile.displayName}
                size={96}
                online={online}
                storyGroup={storyGroup}
              />
            </div>
            <div className="mb-1 min-w-0 flex-1">
              <h1 className="flex items-center gap-2 text-xl font-bold">
                {profile.displayName}
                {badges.map((b) => (
                  <span key={b.label} title={b.label} className="text-base">
                    {b.icon}
                  </span>
                ))}
              </h1>
              <div className="text-sm text-muted">@{profile.username}</div>
              <div
                className={`mt-0.5 text-xs ${online ? "text-green-500" : "text-muted"}`}
              >
                {online ? "● в сети" : presenceLabel(profile.lastSeenAt, false)}
              </div>
              {profile.status && (
                <div className="mt-1 text-sm">{profile.status}</div>
              )}
            </div>
            <div className="mb-1 flex items-center gap-2">
              {isSelf ? (
                <Link href="/settings" className="btn-ghost px-4 py-1.5 text-sm">
                  Редактировать
                </Link>
              ) : (
                <>
                  <FriendButton targetId={profile.id} state={state} />
                  <MessageButton targetId={profile.id} />
                </>
              )}
            </div>
          </div>

          {profile.bio && <p className="mt-3 text-sm">{profile.bio}</p>}

          {/* Мета-информация */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                🔗 {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <span>📅 на mesto с {joined}</span>
            {!isSelf && mutual > 0 && (
              <span>🤝 {mutual} общих друзей</span>
            )}
          </div>

          {/* Счётчики */}
          <div className="mt-4 flex gap-6 border-t border-border pt-3 text-sm">
            <span>
              <span className="font-semibold">{friendsCount}</span>{" "}
              <span className="text-muted">друзей</span>
            </span>
            {!restricted && (
              <span>
                <span className="font-semibold">{profile._count.posts}</span>{" "}
                <span className="text-muted">записей</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Закрытый профиль — стоп-экран для не-друзей */}
      {restricted && (
        <section className="card p-8 text-center">
          <p className="text-3xl">🔒</p>
          <p className="mt-2 font-medium">Это закрытый профиль</p>
          <p className="mt-1 text-sm text-muted">
            Записи и друзья видны только друзьям. Добавьтесь в друзья, чтобы
            видеть больше.
          </p>
        </section>
      )}

      {/* Вкладки */}
      {!restricted && (
        <>
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={`/profile/${username}?tab=${t.key}`}
                className={`press rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  activeTab === t.key
                    ? "bg-brand-gradient text-white shadow-[var(--shadow-glow)]"
                    : "btn-ghost"
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className="ml-1.5 opacity-70">{t.count}</span>
                )}
              </Link>
            ))}
          </div>

          {/* Записи */}
          {activeTab === "posts" && (
            <section className="flex flex-col gap-4">
              {isSelf && <PostComposer user={me} />}
              {pinnedPost && (
                <div className="relative">
                  <div className="absolute -top-2 left-4 z-10 rounded-full bg-brand-gradient px-2 py-0.5 text-xs font-medium text-white shadow">
                    📌 Закреплено
                  </div>
                  <PostCard post={pinnedPost} meId={me.id} showPin pinned />
                </div>
              )}
              {wall.length === 0 && !pinnedPost ? (
                <div className="card p-6 text-center text-sm text-muted">
                  {isSelf ? "У вас пока нет записей." : "Пока нет записей."}
                </div>
              ) : (
                <div className="stagger flex flex-col gap-4">
                  {wall.map((post) => (
                    <PostCard key={post.id} post={post} meId={me.id} showPin />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Фото */}
          {activeTab === "photos" &&
            (photos.length === 0 ? (
              <div className="card p-6 text-center text-sm text-muted">
                Пока нет фотографий.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((src, i) => (
                  <Lightbox
                    key={i}
                    images={photos}
                    index={i}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            ))}

          {/* Друзья */}
          {activeTab === "friends" &&
            (friendsList.length === 0 ? (
              <div className="card p-6 text-center text-sm text-muted">
                Пока нет друзей.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {friendsList.map((f) => (
                  <Link
                    key={f.id}
                    href={`/profile/${f.username}`}
                    className="card hover-lift flex items-center gap-2 p-2"
                  >
                    <Avatar src={f.avatarUrl} name={f.displayName} size={44} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {f.displayName}
                      </div>
                      <div className="truncate text-xs text-muted">
                        @{f.username}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}

          {/* Сообщества */}
          {activeTab === "groups" &&
            (groups.length === 0 ? (
              <div className="card p-6 text-center text-sm text-muted">
                Пока не состоит в сообществах.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {groups.map((g) => (
                  <Link
                    key={g.id}
                    href={`/groups/${g.slug}`}
                    className="card hover-lift flex items-center gap-3 p-3"
                  >
                    <Avatar src={g.avatarUrl} name={g.name} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{g.name}</div>
                      <div className="truncate text-xs text-muted">
                        {g.memberCount} участников
                        {g.role === "OWNER" && " · владелец"}
                        {g.role === "ADMIN" && " · админ"}
                      </div>
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
