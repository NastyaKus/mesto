"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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
              className={`press relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
                active ? "text-brand" : "text-muted"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full text-xl leading-none transition-all ${
                  active ? "bg-brand-gradient-soft" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {item.badge > 0 && (
                <motion.span
                  key={item.badge}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 16 }}
                  className="bg-brand-gradient absolute top-1 right-[20%] min-w-4 rounded-full px-1 text-[10px] font-semibold text-white shadow"
                >
                  {item.badge}
                </motion.span>
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
            className={`press flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              active
                ? "bg-brand-gradient text-white shadow-[var(--shadow-glow)]"
                : "hover:bg-surface-2"
            }`}
          >
            <span>
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </span>
            {item.badge > 0 && (
              <motion.span
                key={item.badge}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 16 }}
                className={`min-w-5 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${
                  active ? "bg-white/25 text-white" : "bg-brand-gradient text-white"
                }`}
              >
                {item.badge}
              </motion.span>
            )}
          </Link>
        );
      })}
    </>
  );
}
