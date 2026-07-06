"use client";

import { useOptimistic, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { renderRichText } from "@/lib/rich-text";
import {
  setReaction,
  addComment,
  editComment,
  deleteComment,
  toggleBookmark,
  repost,
} from "@/lib/actions/posts";
import type { FeedComment, FeedPost } from "@/lib/posts";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

type ReactionState = {
  reactions: FeedPost["reactions"];
  myReaction: string | null;
};

// Пересчитывает реакции при клике по эмодзи (оптимистично).
function applyReaction(state: ReactionState, emoji: string): ReactionState {
  const map = new Map(state.reactions.map((r) => [r.emoji, r.count]));
  const bump = (e: string, d: number) =>
    map.set(e, Math.max(0, (map.get(e) ?? 0) + d));

  let myReaction: string | null;
  if (state.myReaction === emoji) {
    bump(emoji, -1);
    myReaction = null;
  } else if (state.myReaction) {
    bump(state.myReaction, -1);
    bump(emoji, 1);
    myReaction = emoji;
  } else {
    bump(emoji, 1);
    myReaction = emoji;
  }

  const reactions = [...map.entries()]
    .filter(([, c]) => c > 0)
    .map(([e, c]) => ({ emoji: e, count: c }))
    .sort((a, b) => b.count - a.count);
  return { reactions, myReaction };
}

export function PostInteractions({
  postId,
  reactions,
  myReaction,
  comments,
  savedByMe,
  meId,
}: {
  postId: string;
  reactions: FeedPost["reactions"];
  myReaction: string | null;
  comments: FeedComment[];
  savedByMe: boolean;
  meId: string;
}) {
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [saved, setSaved] = useState(savedByMe);
  const [reposted, setReposted] = useState(false);

  const onBookmark = () => {
    setSaved((v) => !v);
    startTransition(() => toggleBookmark(postId));
  };
  const onRepost = () => {
    if (reposted) return;
    setReposted(true);
    startTransition(() => repost(postId));
  };

  const [state, setState] = useOptimistic<ReactionState>({
    reactions,
    myReaction,
  });

  const react = (emoji: string) => {
    setShowPicker(false);
    startTransition(async () => {
      setState(applyReaction(state, emoji));
      await setReaction(postId, emoji);
    });
  };

  const total = state.reactions.reduce((s, r) => s + r.count, 0);
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  return (
    <div className="mt-3">
      <div className="relative flex items-center gap-2 border-t border-border pt-2 text-sm">
        {/* Кнопка реакции */}
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5"
          style={{ color: state.myReaction ? "var(--brand)" : undefined }}
        >
          <span className="animate-pop inline-block">
            {state.myReaction ?? "🙂"}
          </span>
          <span>{state.myReaction ? "Вы" : "Реакция"}</span>
        </button>

        {showPicker && (
          <div className="animate-fade-in absolute bottom-11 left-0 z-10 flex gap-1 rounded-full border border-border bg-surface p-1 shadow-lg">
            {REACTIONS.map((e) => (
              <button
                key={e}
                onClick={() => react(e)}
                className="rounded-full p-1 text-xl transition-transform hover:scale-125"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Сводка реакций */}
        {total > 0 && (
          <span className="flex items-center gap-0.5 text-muted">
            {state.reactions.slice(0, 3).map((r) => (
              <span key={r.emoji}>{r.emoji}</span>
            ))}
            <span className="ml-1">{total}</span>
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onBookmark}
            title={saved ? "Убрать из закладок" : "Сохранить"}
            className="btn-ghost press flex items-center gap-1.5 px-3 py-1.5"
            style={{ color: saved ? "var(--brand)" : undefined }}
          >
            {saved ? "🔖" : "🏷️"}
          </button>
          <button
            onClick={onRepost}
            disabled={reposted}
            title="Репост на свою стену"
            className="btn-ghost press flex items-center gap-1.5 px-3 py-1.5"
            style={{ color: reposted ? "var(--brand)" : undefined }}
          >
            🔁
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="btn-ghost flex items-center gap-1.5 px-3 py-1.5"
          >
            💬 {comments.length > 0 ? comments.length : "Коммент."}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-fade-in mt-3 flex flex-col gap-3">
          {topLevel.map((c) => (
            <div key={c.id} className="flex flex-col gap-2">
              <CommentRow
                comment={c}
                meId={meId}
                onReply={() => setReplyTo(replyTo === c.id ? null : c.id)}
              />
              {/* Ответы */}
              {repliesOf(c.id).map((r) => (
                <div key={r.id} className="ml-10">
                  <CommentRow
                    comment={r}
                    meId={meId}
                    onReply={() => setReplyTo(replyTo === c.id ? null : c.id)}
                  />
                </div>
              ))}
              {replyTo === c.id && (
                <div className="ml-10">
                  <CommentForm
                    postId={postId}
                    parentId={c.id}
                    placeholder={`Ответить ${c.author.displayName}…`}
                    onDone={() => setReplyTo(null)}
                  />
                </div>
              )}
            </div>
          ))}
          <CommentForm postId={postId} />
        </div>
      )}
    </div>
  );
}

function CommentRow({
  comment,
  meId,
  onReply,
}: {
  comment: FeedComment;
  meId: string;
  onReply: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);
  const mine = comment.authorId === meId;

  const saveEdit = () => {
    const value = editRef.current?.value.trim();
    if (!value) return;
    setEditing(false);
    startTransition(() => editComment(comment.id, value));
  };

  return (
    <div className="flex gap-2">
      <Link href={`/profile/${comment.author.username}`}>
        <Avatar
          src={comment.author.avatarUrl}
          name={comment.author.displayName}
          size={32}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-surface-2 px-3 py-2">
          <Link
            href={`/profile/${comment.author.username}`}
            className="text-sm font-medium hover:text-brand"
          >
            {comment.author.displayName}
          </Link>
          {editing ? (
            <div className="mt-1 flex gap-2">
              <input
                ref={editRef}
                defaultValue={comment.content}
                className="input text-sm"
              />
              <button
                onClick={saveEdit}
                disabled={pending}
                className="btn-primary px-3 py-1 text-xs"
              >
                ОК
              </button>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {renderRichText(comment.content)}
              {comment.editedAt && (
                <span className="ml-1 text-xs text-muted">(изменено)</span>
              )}
            </p>
          )}
        </div>
        <div className="mt-1 flex gap-3 pl-3 text-xs text-muted">
          <button onClick={onReply} className="hover:text-brand">
            Ответить
          </button>
          {mine && (
            <>
              <button
                onClick={() => setEditing((v) => !v)}
                className="hover:text-brand"
              >
                Изменить
              </button>
              <button
                onClick={() => startTransition(() => deleteComment(comment.id))}
                className="hover:text-like"
              >
                Удалить
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentForm({
  postId,
  parentId,
  placeholder = "Написать комментарий…",
  onDone,
}: {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value) return;
    if (inputRef.current) inputRef.current.value = "";
    startTransition(() => addComment(postId, value, parentId));
    onDone?.();
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input ref={inputRef} placeholder={placeholder} className="input text-sm" />
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
