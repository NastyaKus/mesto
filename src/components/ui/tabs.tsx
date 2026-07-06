"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export type TabItem = {
  key: string;
  label: string;
  href: string;
  count?: number;
};

// Вкладки со скользящей «пилюлей»-индикатором (общий layoutId).
export function Tabs({
  items,
  active,
  layoutId = "tab-pill",
}: {
  items: TabItem[];
  active: string;
  layoutId?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`press relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              on ? "text-white" : "btn-ghost"
            }`}
          >
            {on && (
              <motion.span
                layoutId={layoutId}
                className="bg-brand-gradient absolute inset-0 -z-0 rounded-full shadow-[var(--shadow-glow)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1.5 opacity-70">{t.count}</span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
