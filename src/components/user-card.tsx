import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { FriendButton } from "@/components/friend-button";
import type { FriendState } from "@/lib/friends";

type Props = {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  state: FriendState;
};

// Строка пользователя: аватар, имя, ссылка на профиль и кнопка дружбы.
export function UserCard({ user, state }: Props) {
  return (
    <div className="card flex items-center gap-3 p-3 transition-transform hover:-translate-y-0.5">
      <Link href={`/profile/${user.username}`}>
        <Avatar src={user.avatarUrl} name={user.displayName} size={48} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${user.username}`}
          className="block truncate font-medium transition-colors hover:text-brand"
        >
          {user.displayName}
        </Link>
        <div className="truncate text-xs text-muted">@{user.username}</div>
      </div>
      <FriendButton targetId={user.id} state={state} />
    </div>
  );
}
