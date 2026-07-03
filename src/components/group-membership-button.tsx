"use client";

import { useTransition } from "react";
import { joinGroup, leaveGroup } from "@/lib/actions/groups";

type Props = {
  groupId: string;
  isMember: boolean;
  isOwner: boolean;
};

export function GroupMembershipButton({ groupId, isMember, isOwner }: Props) {
  const [pending, startTransition] = useTransition();

  if (isOwner) {
    return (
      <span className="btn-ghost cursor-default px-4 py-1.5 text-sm">
        👑 Владелец
      </span>
    );
  }

  if (isMember) {
    return (
      <button
        disabled={pending}
        onClick={() => startTransition(() => leaveGroup(groupId))}
        className="btn-ghost px-4 py-1.5 text-sm"
      >
        Вы участник · Выйти
      </button>
    );
  }

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => joinGroup(groupId))}
      className="btn-primary px-4 py-1.5 text-sm"
    >
      Вступить
    </button>
  );
}
