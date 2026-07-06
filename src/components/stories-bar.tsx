"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { StoryViewer } from "@/components/story-viewer";
import type { StoryGroup } from "@/lib/stories";
import { postStory } from "@/lib/actions/stories";

export function StoriesBar({
  groups,
  me,
}: {
  groups: StoryGroup[];
  me: { displayName: string; avatarUrl: string | null };
}) {
  const router = useRouter();
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const myIndex = groups.findIndex((g) => g.isMine);
  const myGroup = myIndex >= 0 ? groups[myIndex] : null;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
      if (res.ok && data.url) {
        await postStory(data.url);
        router.refresh();
      }
    } catch {
      // молча игнорируем — пользователь попробует снова
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card animate-fade-up mb-4 p-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
      <div className="flex gap-4 overflow-x-auto">
        {/* Моя история / добавить */}
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          <div className="relative">
            <button
              onClick={() =>
                myGroup ? setOpenAt(myIndex) : fileRef.current?.click()
              }
              className={`rounded-full p-0.5 ${
                myGroup ? "bg-brand-gradient" : "border-2 border-dashed border-border"
              }`}
            >
              <div className="rounded-full ring-2 ring-surface">
                <Avatar src={me.avatarUrl} name={me.displayName} size={56} />
              </div>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Добавить историю"
              className="bg-brand-gradient absolute -right-0.5 -bottom-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm text-white ring-2 ring-surface"
            >
              {uploading ? <span className="spinner" /> : "+"}
            </button>
          </div>
          <span className="w-full truncate text-center text-xs">Вы</span>
        </div>

        {/* Истории друзей */}
        {groups.map((g, i) =>
          g.isMine ? null : (
            <div
              key={g.author.id}
              className="flex w-16 shrink-0 flex-col items-center gap-1"
            >
              <button
                onClick={() => setOpenAt(i)}
                className={`rounded-full p-0.5 ${
                  g.hasUnseen ? "bg-brand-gradient" : "bg-border"
                }`}
              >
                <div className="rounded-full ring-2 ring-surface">
                  <Avatar
                    src={g.author.avatarUrl}
                    name={g.author.displayName}
                    size={56}
                  />
                </div>
              </button>
              <span className="w-full truncate text-center text-xs">
                {g.author.displayName}
              </span>
            </div>
          ),
        )}
      </div>

      {openAt !== null && (
        <StoryViewer
          groups={groups}
          startGroup={openAt}
          onClose={() => setOpenAt(null)}
        />
      )}
    </div>
  );
}
