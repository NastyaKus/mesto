"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ImagePicker } from "@/components/ui/image-picker";
import { createGroupChat } from "@/lib/actions/messages";

type Friend = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

// Форма создания групповой беседы: название + отметки друзей.
export function NewGroupForm({ friends }: { friends: Friend[] }) {
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSubmit = title.trim().length > 0 && selected.size > 0 && !pending;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    const avatarUrl = (new FormData(e.currentTarget).get("avatarUrl") as string) || undefined;
    startTransition(() => createGroupChat(title.trim(), [...selected], avatarUrl));
  };

  if (friends.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-muted">
        Чтобы создать беседу, добавьте кого-нибудь в друзья.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card animate-fade-up p-5">
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-medium text-muted">
          Название беседы
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder="Например: Поход в горы 🏔️"
          className="input"
          autoFocus
        />
      </label>

      <div className="mb-4">
        <span className="mb-1 block text-sm font-medium text-muted">
          Аватар беседы (необязательно)
        </span>
        <ImagePicker name="avatarUrl" />
      </div>

      <div className="mb-4">
        <span className="mb-2 block text-sm font-medium text-muted">
          Кого добавить · выбрано {selected.size}
        </span>
        <div className="flex flex-col gap-1">
          {friends.map((f) => {
            const on = selected.has(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggle(f.id)}
                className={`flex items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                  on ? "bg-surface-2" : "hover:bg-surface-2"
                }`}
              >
                <Avatar src={f.avatarUrl} name={f.displayName} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {f.displayName}
                  </div>
                  <div className="truncate text-xs text-muted">
                    @{f.username}
                  </div>
                </div>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                    on
                      ? "border-brand bg-brand-gradient text-white"
                      : "border-border"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button type="submit" disabled={!canSubmit} className="btn-primary px-5 py-2">
        {pending ? <span className="spinner" /> : "Создать беседу"}
      </button>
    </form>
  );
}
