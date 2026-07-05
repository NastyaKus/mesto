"use client";

import { useState, useRef, useTransition } from "react";
import { renderRichText } from "@/lib/rich-text";
import { editPost } from "@/lib/actions/posts";

type Props = {
  postId: string;
  content: string;
  editedAt: Date | string | null;
  isMine: boolean;
};

// Тело поста: просмотр (с @упоминаниями/#тегами) и инлайн-редактирование для своих.
export function PostContent({ postId, content, editedAt, isMine }: Props) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  if (editing) {
    return (
      <div className="mt-3">
        <textarea
          ref={ref}
          defaultValue={content}
          rows={3}
          className="input resize-none"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => {
              const value = ref.current?.value.trim();
              if (!value) return;
              setEditing(false);
              startTransition(() => editPost(postId, value));
            }}
            disabled={pending}
            className="btn-primary px-4 py-1.5 text-sm"
          >
            Сохранить
          </button>
          <button
            onClick={() => setEditing(false)}
            className="btn-ghost px-4 py-1.5 text-sm"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <p className="mt-3 whitespace-pre-wrap break-words">
      {renderRichText(content)}
      {editedAt && <span className="ml-1 text-xs text-muted">(изменено)</span>}
      {isMine && (
        <button
          onClick={() => setEditing(true)}
          className="ml-2 text-xs text-muted hover:text-brand"
        >
          ✏️ изменить
        </button>
      )}
    </p>
  );
}
