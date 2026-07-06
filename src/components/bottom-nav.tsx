import { NavLinks, type NavItem } from "@/components/nav-links";

// Нижняя навигация для мобильных (прячется на десктопе).
export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-20 flex border-t border-border md:hidden">
      <NavLinks items={items} variant="bottom" />
    </nav>
  );
}
