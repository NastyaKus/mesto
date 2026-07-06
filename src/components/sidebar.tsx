import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { logoutUser } from "@/lib/actions/auth";
import { NavLinks, type NavItem } from "@/components/nav-links";

type Props = {
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  items: NavItem[];
};

export function Sidebar({ user, items }: Props) {
  return (
    <aside className="animate-fade-up hidden w-56 shrink-0 flex-col gap-3 md:flex">
      <Link
        href={`/profile/${user.username}`}
        className="card hover-lift flex items-center gap-3 p-3"
      >
        <Avatar src={user.avatarUrl} name={user.displayName} size={44} />
        <div className="min-w-0">
          <div className="truncate font-semibold">{user.displayName}</div>
          <div className="truncate text-xs text-muted">@{user.username}</div>
        </div>
      </Link>

      <nav className="card flex flex-col gap-0.5 p-2">
        <NavLinks items={items} variant="sidebar" />
        <form action={logoutUser}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-2"
          >
            <span className="mr-2">🚪</span>Выйти
          </button>
        </form>
      </nav>
    </aside>
  );
}
