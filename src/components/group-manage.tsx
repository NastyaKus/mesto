"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import {
  renameConversation,
  addParticipants,
  leaveConversation,
} from "@/lib/actions/messages";

type Member = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isOwner: boolean;
};

type Friend = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export function GroupManage({
  conversationId,
  title,
  isOwner,
  members,
  addable,
}: {
  conversationId: string;
  title: string;
  isOwner: boolean;
  members: Member[];
  addable: Friend[];
}) {
  const [name, setName] = useState(title);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      {/* Название (правит владелец) */}
      {isOwner && (
        <div className="card p-4">
          <span className="mb-1 block text-sm font-medium text-muted">
            Название
          </span>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="input"
            />
            <button
              type="button"
              disabled={pending || !name.trim() || name.trim() === title}
              onClick={() =>
                startTransition(() =>
                  renameConversation(conversationId, name.trim()),
                )
              }
              className="btn-primary px-4 py-2 text-sm"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Участники */}
      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted">
          Участники · {members.length}
        </h2>
        <div className="flex flex-col gap-1">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-1">
              <Link href={`/profile/${m.username}`}>
                <Avatar src={m.avatarUrl} name={m.displayName} size={40} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${m.username}`}
                  className="block truncate text-sm font-medium hover:text-brand"
                >
                  {m.displayName}
                </Link>
                <div className="truncate text-xs text-muted">@{m.username}</div>
              </div>
              {m.isOwner && (
                <span className="text-xs text-muted">владелец</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Добавить друзей */}
      {addable.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted">
            Добавить друзей
          </h2>
          <div className="flex flex-col gap-1">
            {addable.map((f) => {
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
                  <Avatar src={f.avatarUrl} name={f.displayName} size={36} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {f.displayName}
                  </span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                      on ? "border-brand bg-brand-gradient text-white" : "border-border"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={pending || selected.size === 0}
            onClick={() =>
              startTransition(async () => {
                await addParticipants(conversationId, [...selected]);
                setSelected(new Set());
              })
            }
            className="btn-primary mt-3 px-4 py-2 text-sm"
          >
            Добавить · {selected.size}
          </button>
        </div>
      )}

      {/* Выйти */}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Выйти из беседы?"))
            startTransition(() => leaveConversation(conversationId));
        }}
        className="btn-ghost px-4 py-2 text-sm text-like"
      >
        Выйти из беседы
      </button>
    </div>
  );
}
