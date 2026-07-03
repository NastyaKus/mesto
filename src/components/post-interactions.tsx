"use client";

import { useOptimistic, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { toggleLike, addComment } from "@/lib/actions/posts";
import type { FeedPost } from "@/lib/posts";

type Props = {
  postId: string;
  likedByMe: boolean;
  likeCount: number;
  comments: FeedPost["comments"];
};

export function PostInteractions({
  postId,
  likedByMe,
  likeCount,
  comments,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [popKey, setPopKey] = useState(0);

  // Оптимистичный лайк — мгновенная реакция до ответа сервера.
  const [like, setLike] = useOptimistic({ liked: likedByMe, count: likeCount });

  const onLike = () => {
    setPopKey((k) => k + 1);
    startTransition(async () => {
      setLike({
        liked: !like.liked,
        count: like.count + (like.liked ? -1 : 1),
      });
      await toggleLike(postId);
    });
  };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 border-t border-border pt-2 text-sm">
        <button
          onClick={onLike}
          disabled={isPending}
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5"
          style={{ color: like.liked ? "var(--like)" : undefined }}
        >
          <span key={popKey} className="animate-pop inline-block">
            {like.liked ? "❤️" : "🤍"}
          </span>
          {like.count > 0 && <span>{like.count}</span>}
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5"
        >
          💬 {comments.length > 0 ? comments.length : "Комментировать"}
        </button>
      </div>

      {open && (
        <div className="animate-fade-in mt-3 flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Link href={`/profile/${c.author.username}`}>
                <Avatar
                  src={c.author.avatarUrl}
                  name={c.author.displayName}
                  size={32}
                />
              </Link>
              <div className="rounded-2xl bg-surface-2 px-3 py-2">
                <Link
                  href={`/profile/${c.author.username}`}
                  className="text-sm font-medium hover:text-brand"
                >
                  {c.author.displayName}
                </Link>
                <p className="text-sm">{c.content}</p>
              </div>
            </div>
          ))}
          <CommentForm postId={postId} />
        </div>
      )}
    </div>
  );
}

function CommentForm({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value) return;
    if (inputRef.current) inputRef.current.value = "";
    startTransition(() => addComment(postId, value));
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        ref={inputRef}
        placeholder="Написать комментарий…"
        className="input text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="btn-primary px-4 py-1.5 text-sm"
      >
        →
      </button>
    </form>
  );
}
