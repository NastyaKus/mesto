import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getGroup, getMembership } from "@/lib/groups";
import { getGroupPosts } from "@/lib/posts";
import { Avatar } from "@/components/ui/avatar";
import { GroupMembershipButton } from "@/components/group-membership-button";
import { PostComposer } from "@/components/post-composer";
import { PostCard } from "@/components/post-card";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = (await getCurrentUser())!;

  const group = await getGroup(slug);
  if (!group) notFound();

  const [role, posts] = await Promise.all([
    getMembership(group.id, me.id),
    getGroupPosts(group.id, me.id),
  ]);

  const isMember = role !== null;
  const isOwner = role === "OWNER";
  const canPost = role === "OWNER" || role === "ADMIN";

  return (
    <div className="flex flex-col gap-5">
      {/* Шапка сообщества */}
      <section className="card animate-fade-up overflow-hidden p-0">
        <div className="bg-brand-gradient h-24" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end gap-4">
            <div className="rounded-full ring-4 ring-surface">
              <Avatar src={group.avatarUrl} name={group.name} size={80} />
            </div>
            <div className="mb-1 flex-1">
              <h1 className="text-xl font-bold">{group.name}</h1>
              <div className="text-sm text-muted">
                {group.memberCount}{" "}
                {group.memberCount === 1 ? "участник" : "участников"}
              </div>
            </div>
            <div className="mb-1">
              <GroupMembershipButton
                groupId={group.id}
                isMember={isMember}
                isOwner={isOwner}
              />
            </div>
          </div>
          {group.description && (
            <p className="mt-3 text-sm">{group.description}</p>
          )}
        </div>
      </section>

      {/* Стена сообщества */}
      <section>
        {canPost && (
          <PostComposer
            user={{ displayName: group.name, avatarUrl: group.avatarUrl }}
            groupId={group.id}
            placeholder="Написать от лица сообщества…"
          />
        )}
        {posts.length === 0 ? (
          <div className="card p-6 text-center text-sm text-muted">
            В сообществе пока нет записей.
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
