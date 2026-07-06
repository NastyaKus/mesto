import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getConversationAccess } from "@/lib/messages";
import { getFriends } from "@/lib/friends";
import { GroupManage } from "@/components/group-manage";

export default async function GroupInfoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = (await getCurrentUser())!;

  const access = await getConversationAccess(id, me.id);
  if (!access || !access.convo.isGroup) notFound();

  const ownerId = access.convo.ownerId;
  const memberIds = new Set(access.convo.participants.map((p) => p.userId));
  const members = access.convo.participants.map((p) => ({
    id: p.user.id,
    displayName: p.user.displayName,
    username: p.user.username,
    avatarUrl: p.user.avatarUrl,
    isOwner: p.userId === ownerId,
  }));

  // Друзья, которых ещё нет в беседе — их можно добавить.
  const friends = await getFriends(me.id);
  const addable = friends
    .filter((f) => !memberIds.has(f.id))
    .map((f) => ({
      id: f.id,
      displayName: f.displayName,
      username: f.username,
      avatarUrl: f.avatarUrl,
    }));

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href={`/messages/${id}`} className="btn-ghost px-3 py-1.5 text-sm">
          ← В беседу
        </Link>
        <h1 className="truncate text-lg font-semibold">
          {access.convo.title ?? "Беседа"}
        </h1>
      </div>
      <GroupManage
        conversationId={id}
        title={access.convo.title ?? ""}
        isOwner={ownerId === me.id}
        members={members}
        addable={addable}
      />
    </div>
  );
}
