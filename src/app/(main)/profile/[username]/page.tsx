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
import { getUserPosts } from "@/lib/posts";
import { Avatar } from "@/components/ui/avatar";
import { Lightbox } from "@/components/ui/lightbox";
import { FriendButton } from "@/components/friend-button";
import { MessageButton } from "@/components/message-button";
import { PostComposer } from "@/components/post-composer";
import { PostCard } from "@/components/post-card";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const me = (await getCurrentUser())!;

  const profile = await prisma.user.findUnique({
    where: { username },
    select: publicUserSelect,
  });
  if (!profile) notFound();

  const [state, friendsCount] = await Promise.all([
    getFriendState(me.id, profile.id),
    countFriends(profile.id),
  ]);

  const isSelf = state === "SELF";
  // Закрытый профиль: не-друзьям прячем стену и список друзей.
  const restricted = profile.isPrivate && !isSelf && state !== "FRIENDS";

  // Стену и друзей грузим только если профиль доступен зрителю — иначе это
  // лишние запросы к БД ради данных, которые всё равно не покажем.
  const [friends, posts] = restricted
    ? [[], []]
    : await Promise.all([
        getFriends(profile.id),
        getUserPosts(profile.id, me.id),
      ]);
  const joined = new Date(profile.createdAt).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Шапка профиля с обложкой */}
      <section className="card animate-fade-up overflow-hidden p-0">
        {profile.coverUrl ? (
          <Lightbox
            src={profile.coverUrl}
            className="h-36 w-full object-cover"
          />
        ) : (
          <div className="bg-brand-gradient h-36" />
        )}
        <div className="px-5 pb-5">
          <div className="-mt-12 flex flex-wrap items-end gap-4">
            <div className="rounded-full ring-4 ring-surface">
              <Avatar
                src={profile.avatarUrl}
                name={profile.displayName}
                size={96}
              />
            </div>
            <div className="mb-1 min-w-0 flex-1">
              <h1 className="text-xl font-bold">{profile.displayName}</h1>
              <div className="text-sm text-muted">@{profile.username}</div>
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
          </div>

          {/* Счётчики */}
          <div className="mt-4 flex gap-6 border-t border-border pt-3 text-sm">
            <span>
              <span className="font-semibold">{friendsCount}</span>{" "}
              <span className="text-muted">друзей</span>
            </span>
            {!restricted && (
              <span>
                <span className="font-semibold">{posts.length}</span>{" "}
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

      {/* Друзья (компактная сетка аватаров) */}
      {!restricted && friends.length > 0 && (
        <section className="card animate-fade-up p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted">
            Друзья · {friendsCount}
          </h2>
          <div className="flex flex-wrap gap-4">
            {friends.slice(0, 12).map((f) => (
              <Link
                key={f.id}
                href={`/profile/${f.username}`}
                className="flex w-16 flex-col items-center gap-1 text-center transition-transform hover:-translate-y-0.5"
              >
                <Avatar src={f.avatarUrl} name={f.displayName} size={56} />
                <span className="w-full truncate text-xs">{f.displayName}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Стена */}
      {!restricted && (
        <section>
          {isSelf && <PostComposer user={me} />}
          {posts.length === 0 ? (
            <div className="card p-6 text-center text-sm text-muted">
              {isSelf ? "У вас пока нет записей." : "Пока нет записей."}
            </div>
          ) : (
            <div className="stagger flex flex-col gap-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} meId={me.id} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
