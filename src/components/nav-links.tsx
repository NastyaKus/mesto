"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge: number;
};

// Навигация с активной подсветкой. Два варианта: боковой и нижний.
export function NavLinks({
  items,
  variant,
}: {
  items: NavItem[];
  variant: "sidebar" | "bottom";
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/feed" ? pathname === "/feed" : pathname.startsWith(href);

  if (variant === "bottom") {
    return (
      <>
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
                active ? "text-brand" : "text-muted"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-brand-gradient absolute top-1 right-[22%] min-w-4 rounded-full px-1 text-[10px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-surface-2 text-brand" : "hover:bg-surface-2"
            }`}
          >
            <span>
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </span>
            {item.badge > 0 && (
              <span className="bg-brand-gradient min-w-5 rounded-full px-2 py-0.5 text-center text-xs font-semibold text-white">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}
