"use client";

import { useEffect, useRef, useState } from "react";

// Небольшой набор эмодзи по категориям — без внешних зависимостей.
const EMOJI: Record<string, string[]> = {
  "Смайлы": "😀 😁 😂 🤣 😊 😍 😘 😎 🤔 😅 😉 🙂 🙃 😴 😭 😡 🥳 🤗 😇 🤩 😜 😏 🥺 😢".split(" "),
  "Жесты": "👍 👎 👏 🙌 🤝 💪 🙏 👋 ✌️ 🤟 👌 🫶 🤙 ✊".split(" "),
  "Сердца": "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💖 💕 💔 ❣️".split(" "),
  "Разное": "🔥 ✨ 🎉 🎁 🌟 ⭐ 💯 🚀 🌈 ☀️ 🌙 ⚡ 🍀 🎶 📌 ✅".split(" "),
};

// Кнопка-триггер с всплывающей панелью эмодзи. Вставку делает родитель (onPick).
export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Эмодзи"
        className="btn-ghost px-3 py-2"
      >
        😊
      </button>
      {open && (
        <div className="animate-scale-in absolute bottom-full left-0 z-20 mb-2 max-h-72 w-72 overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-lg)]">
          {Object.entries(EMOJI).map(([cat, list]) => (
            <div key={cat} className="mb-2">
              <div className="mb-1 px-1 text-xs font-medium text-muted">{cat}</div>
              <div className="grid grid-cols-8 gap-0.5">
                {list.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      onPick(e);
                      setOpen(false);
                    }}
                    className="rounded-lg p-1 text-xl transition-transform hover:scale-125 hover:bg-surface-2"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
