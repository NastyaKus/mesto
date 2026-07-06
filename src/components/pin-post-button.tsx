"use client";

import { useTransition } from "react";
import { pinPost, unpinPost } from "@/lib/actions/posts";

// Закрепить/открепить свой пост в профиле.
export function PinPostButton({
  postId,
  pinned,
}: {
  postId: string;
  pinned: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => (pinned ? unpinPost() : pinPost(postId)))
      }
      title={pinned ? "Открепить" : "Закрепить в профиле"}
      className={`press text-sm ${pinned ? "text-brand" : "text-muted hover:text-brand"}`}
    >
      📌
    </button>
  );
}
