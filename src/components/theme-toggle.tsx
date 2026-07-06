"use client";

import { useState } from "react";
import type { ThemePref } from "@/lib/theme";

// Циклический переключатель темы: светлая → тёмная → системная → …
// Выбор хранится в cookie (для SSR без вспышки) и localStorage.
// Начальное значение приходит пропом из серверного layout.
const ORDER: ThemePref[] = ["light", "dark", "system"];

const META: Record<ThemePref, { icon: string; title: string }> = {
  light: { icon: "☀️", title: "Тема: светлая" },
  dark: { icon: "🌙", title: "Тема: тёмная" },
  system: { icon: "🖥️", title: "Тема: как в системе" },
};

// Применяет тему к <html>: явный выбор пишем в data-theme,
// системный режим убирает атрибут — дальше решает CSS-медиазапрос.
function apply(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") delete root.dataset.theme;
  else root.dataset.theme = pref;
}

export function ThemeToggle({ initial }: { initial: ThemePref }) {
  const [pref, setPref] = useState<ThemePref>(initial);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    setPref(next);
    apply(next);
    localStorage.setItem("theme", next);
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  const { icon, title } = META[pref];

  return (
    <button
      onClick={cycle}
      aria-label="Сменить тему"
      title={title}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition-colors hover:bg-surface-2"
    >
      {icon}
    </button>
  );
}
