"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { StoryViewer } from "@/components/story-viewer";
import type { StoryGroup } from "@/lib/stories";

// Аватар профиля: при наличии активных историй — градиентное кольцо и открытие
// просмотрщика по клику; иначе обычный аватар (с онлайн-точкой).
export function ProfileAvatar({
  src,
  name,
  size,
  online,
  storyGroup,
}: {
  src: string | null;
  name: string;
  size: number;
  online?: boolean;
  storyGroup?: StoryGroup | null;
}) {
  const [open, setOpen] = useState(false);

  if (!storyGroup) {
    return <Avatar src={src} name={name} size={size} online={online} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Смотреть истории"
        className={`press rounded-full p-0.5 ${
          storyGroup.hasUnseen ? "bg-brand-gradient" : "bg-border"
        }`}
      >
        <div className="rounded-full ring-2 ring-surface">
          <Avatar src={src} name={name} size={size} online={online} />
        </div>
      </button>
      {open && (
        <StoryViewer
          groups={[storyGroup]}
          startGroup={0}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
