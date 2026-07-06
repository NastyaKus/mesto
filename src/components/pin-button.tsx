"use client";

import { useTransition } from "react";
import { togglePinConversation } from "@/lib/actions/messages";

// Кнопка закрепить/открепить беседу. Живёт поверх строки-ссылки диалога.
export function PinButton({
  conversationId,
  pinned,
}: {
  conversationId: string;
  pinned: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => togglePinConversation(conversationId))}
      title={pinned ? "Открепить" : "Закрепить"}
      className={`press absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors ${
        pinned
          ? "text-brand"
          : "text-muted opacity-0 hover:bg-surface-2 group-hover:opacity-100"
      }`}
    >
      📌
    </button>
  );
}
