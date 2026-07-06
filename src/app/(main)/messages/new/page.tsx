import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getFriends } from "@/lib/friends";
import { NewGroupForm } from "@/components/new-group-form";

export default async function NewConversationPage() {
  const me = (await getCurrentUser())!;
  const friends = await getFriends(me.id);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/messages" className="btn-ghost px-3 py-1.5 text-sm">
          ← Назад
        </Link>
        <h1 className="text-lg font-semibold">Новая беседа</h1>
      </div>
      <NewGroupForm
        friends={friends.map((f) => ({
          id: f.id,
          displayName: f.displayName,
          username: f.username,
          avatarUrl: f.avatarUrl,
        }))}
      />
    </div>
  );
}
