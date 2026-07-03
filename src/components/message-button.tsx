"use client";

import { useTransition } from "react";
import { startConversation } from "@/lib/actions/messages";

export function MessageButton({ targetId }: { targetId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => startConversation(targetId))}
      className="btn-ghost px-4 py-1.5 text-sm"
    >
      💬 Написать
    </button>
  );
}
