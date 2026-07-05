"use client";

import { useState } from "react";

// Переключатель светлой/тёмной темы. Хранит выбор в cookie (для SSR) и localStorage.
// Начальное значение приходит пропом из серверного layout (без вспышки).
export function ThemeToggle({ initial }: { initial: "light" | "dark" }) {
  const [theme, setTheme] = useState<"light" | "dark">(initial);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <button
      onClick={toggle}
      aria-label="Сменить тему"
      title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition-colors hover:bg-surface-2"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
