"use client";

import { useActionState, useState } from "react";
import { createPost, type PostActionState } from "@/lib/actions/posts";
import { Avatar } from "@/components/ui/avatar";
import { ImagePicker } from "@/components/ui/image-picker";

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

  return (
    <form action={formAction} className="card animate-fade-up mb-5 p-4">
      {groupId && <input type="hidden" name="groupId" value={groupId} />}
      <div className="flex gap-3">
        <Avatar src={user.avatarUrl} name={user.displayName} size={44} />
        <div className="flex-1">
          <textarea
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
            <button
              type="button"
              onClick={() => setShowImage((v) => !v)}
              className="btn-ghost px-3 py-1.5 text-sm"
            >
              🖼️ {showImage ? "Убрать" : "Картинка"}
            </button>
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
