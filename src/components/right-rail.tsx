import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { FriendButton } from "@/components/friend-button";

type SuggestUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

// Правая колонка (десктоп): рекомендации «кого добавить».
export function RightRail({ suggestions }: { suggestions: SuggestUser[] }) {
  return (
    <aside className="animate-fade-up hidden w-64 shrink-0 flex-col gap-4 xl:flex">
      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold">Кого добавить</h2>
        {suggestions.length === 0 ? (
          <p className="text-xs text-muted">Пока некого предложить.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {suggestions.map((u) => (
              <div key={u.id} className="flex flex-col gap-2">
                <Link
                  href={`/profile/${u.username}`}
                  className="flex items-center gap-2"
                >
                  <Avatar src={u.avatarUrl} name={u.displayName} size={40} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium hover:text-brand">
                      {u.displayName}
                    </div>
                    <div className="truncate text-xs text-muted">
                      @{u.username}
                    </div>
                  </div>
                </Link>
                <FriendButton targetId={u.id} state="NONE" compact />
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="px-2 text-xs text-muted">
        mesto · сделано с ❤️ на Next.js
      </p>
    </aside>
  );
}
