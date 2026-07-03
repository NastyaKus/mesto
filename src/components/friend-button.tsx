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
};

const primaryBtn = "btn-primary px-4 py-1.5 text-sm";
const secondaryBtn = "btn-ghost px-4 py-1.5 text-sm disabled:opacity-60";

// Кнопка(и) управления дружбой. Меняет вид в зависимости от состояния.
export function FriendButton({ targetId, state }: Props) {
  const [pending, startTransition] = useTransition();

  if (state === "SELF") return null;

  const run = (fn: () => Promise<void>) => () => startTransition(() => fn());

  if (state === "NONE") {
    return (
      <button
        disabled={pending}
        onClick={run(() => sendFriendRequest(targetId))}
        className={primaryBtn}
      >
        Добавить в друзья
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
        Отменить заявку
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
