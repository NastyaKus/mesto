import { NavLinks, type NavItem } from "@/components/nav-links";

// Нижняя навигация для мобильных (прячется на десктопе).
export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <NavLinks items={items} variant="bottom" />
    </nav>
  );
}
