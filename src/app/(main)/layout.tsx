import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getIncomingRequests, getFriendSuggestions } from "@/lib/friends";
import { countUnread } from "@/lib/messages";
import { countUnreadNotifications } from "@/lib/notifications";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { RightRail } from "@/components/right-rail";
import { SearchBar } from "@/components/search-bar";
import { Avatar } from "@/components/ui/avatar";
import type { NavItem } from "@/components/nav-links";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [incoming, unreadMessages, unreadNotifications, suggestions] =
    await Promise.all([
      getIncomingRequests(user.id),
      countUnread(user.id),
      countUnreadNotifications(user.id),
      getFriendSuggestions(user.id),
    ]);

  const navItems: NavItem[] = [
    { href: "/feed", label: "Новости", icon: "📰", badge: 0 },
    { href: "/friends", label: "Друзья", icon: "👥", badge: incoming.length },
    { href: "/messages", label: "Чаты", icon: "💬", badge: unreadMessages },
    { href: "/groups", label: "Группы", icon: "🌐", badge: 0 },
    {
      href: "/notifications",
      label: "Уведомл.",
      icon: "🔔",
      badge: unreadNotifications,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Верхняя панель */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-6">
          <Link
            href="/feed"
            className="brand-gradient text-2xl font-extrabold tracking-tight"
          >
            mesto
          </Link>
          <SearchBar />
          {/* Аватар-ссылка на профиль — виден на мобильных вместо сайдбара */}
          <Link href={`/profile/${user.username}`} className="shrink-0 md:hidden">
            <Avatar src={user.avatarUrl} name={user.displayName} size={32} />
          </Link>
        </div>
      </header>

      {/* Контент: сайдбар (десктоп) + основная колонка + правый рейл */}
      <div className="mx-auto flex max-w-6xl gap-6 px-3 py-4 sm:px-4 sm:py-6">
        <Sidebar user={user} items={navItems} />
        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
        <RightRail suggestions={suggestions} />
      </div>

      {/* Нижняя навигация (мобильные) */}
      <BottomNav items={navItems} />
    </div>
  );
}
