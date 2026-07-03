"use client";

import { useTransition } from "react";
import { deletePost } from "@/lib/actions/posts";

export function DeletePostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => deletePost(postId))}
      disabled={pending}
      title="Удалить пост"
      className="rounded-lg px-2 py-1 text-muted transition-colors hover:bg-surface-2 hover:text-like"
    >
      ✕
    </button>
  );
}
