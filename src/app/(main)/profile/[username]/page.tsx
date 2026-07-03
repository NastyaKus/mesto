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

  const [state, friendsCount, friends, posts] = await Promise.all([
    getFriendState(me.id, profile.id),
    countFriends(profile.id),
    getFriends(profile.id),
    getUserPosts(profile.id, me.id),
  ]);

  const isSelf = state === "SELF";

  return (
    <div className="flex flex-col gap-5">
      {/* Шапка профиля с обложкой-градиентом */}
      <section className="card animate-fade-up overflow-hidden p-0">
        <div className="bg-brand-gradient h-28" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end gap-4">
            <div className="rounded-full ring-4 ring-surface">
              <Avatar
                src={profile.avatarUrl}
                name={profile.displayName}
                size={88}
              />
            </div>
            <div className="mb-1 flex-1">
              <h1 className="text-xl font-bold">{profile.displayName}</h1>
              <div className="text-sm text-muted">@{profile.username}</div>
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
          <div className="mt-3 text-sm text-muted">
            <span className="font-semibold text-foreground">{friendsCount}</span>{" "}
            друзей
          </div>
        </div>
      </section>

      {/* Друзья (компактная сетка аватаров) */}
      {friends.length > 0 && (
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
      <section>
        {isSelf && <PostComposer user={me} />}
        {posts.length === 0 ? (
          <div className="card p-6 text-center text-sm text-muted">
            {isSelf ? "У вас пока нет записей." : "Пока нет записей."}
          </div>
        ) : (
          <div className="stagger flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
