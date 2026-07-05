"use client";

import { useTransition } from "react";
import type { FriendState } from "@/lib/friends";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "@/lib/actions/friends";

type Props = {
  targetId: string;
  state: FriendState;
  // Компактный режим для узких мест (правая колонка).
  compact?: boolean;
};

// Кнопка(и) управления дружбой. Меняет вид в зависимости от состояния.
export function FriendButton({ targetId, state, compact }: Props) {
  const [pending, startTransition] = useTransition();

  const primaryBtn = `btn-primary text-sm ${compact ? "w-full px-3 py-1" : "px-4 py-1.5"}`;
  const secondaryBtn = `btn-ghost text-sm disabled:opacity-60 ${compact ? "w-full px-3 py-1" : "px-4 py-1.5"}`;

  if (state === "SELF") return null;

  const run = (fn: () => Promise<void>) => () => startTransition(() => fn());

  if (state === "NONE") {
    return (
      <button
        disabled={pending}
        onClick={run(() => sendFriendRequest(targetId))}
        className={primaryBtn}
      >
        {compact ? "＋ Добавить" : "Добавить в друзья"}
      </button>
    );
  }

  if (state === "OUTGOING") {
    return (
      <button
        disabled={pending}
        onClick={run(() => removeFriend(targetId))}
        className={secondaryBtn}
      >
        {compact ? "Заявка отправлена" : "Отменить заявку"}
      </button>
    );
  }

  if (state === "INCOMING") {
    return (
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={run(() => acceptFriendRequest(targetId))}
          className={primaryBtn}
        >
          Принять
        </button>
        <button
          disabled={pending}
          onClick={run(() => declineFriendRequest(targetId))}
          className={secondaryBtn}
        >
          Отклонить
        </button>
      </div>
    );
  }

  // FRIENDS
  return (
    <button
      disabled={pending}
      onClick={run(() => removeFriend(targetId))}
      className={secondaryBtn}
    >
      ✓ В друзьях
    </button>
  );
}
