"use client";

import { useActionState, useRef, useState } from "react";
import { createPost, type PostActionState } from "@/lib/actions/posts";
import { Avatar } from "@/components/ui/avatar";
import { ImagePicker } from "@/components/ui/image-picker";
import { EmojiPicker } from "@/components/ui/emoji-picker";

type Props = {
  user: { displayName: string; avatarUrl?: string | null };
  // Если задан — пост публикуется от лица сообщества.
  groupId?: string;
  placeholder?: string;
};

const initial: PostActionState = {};

export function PostComposer({ user, groupId, placeholder }: Props) {
  const [state, formAction, pending] = useActionState(createPost, initial);
  const [showImage, setShowImage] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const insertEmoji = (emoji: string) => {
    const el = textRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    el.value = el.value.slice(0, start) + emoji + el.value.slice(el.selectionEnd ?? start);
    el.focus();
    el.selectionStart = el.selectionEnd = start + emoji.length;
  };

  return (
    <form action={formAction} className="card animate-fade-up mb-5 p-4">
      {groupId && <input type="hidden" name="groupId" value={groupId} />}
      <div className="flex gap-3">
        <Avatar src={user.avatarUrl} name={user.displayName} size={44} />
        <div className="flex-1">
          <textarea
            ref={textRef}
            name="content"
            rows={2}
            placeholder={placeholder ?? "Что у вас нового?"}
            className="input resize-none"
          />
          {showImage && <ImagePicker name="imageUrl" />}
          {state.error && (
            <p className="mt-1 text-xs text-like">{state.error}</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowImage((v) => !v)}
                className="btn-ghost px-3 py-1.5 text-sm"
              >
                🖼️ {showImage ? "Убрать" : "Картинка"}
              </button>
              <EmojiPicker onPick={insertEmoji} />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="btn-primary flex items-center gap-2 px-5 py-1.5 text-sm"
            >
              {pending && <span className="spinner" />}
              Опубликовать
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
