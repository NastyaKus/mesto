"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";
import type { StoryGroup } from "@/lib/stories";
import { viewStory, removeStory, fetchStoryViewers } from "@/lib/actions/stories";

const STORY_MS = 6000;

type Viewer = { username: string; displayName: string; avatarUrl: string | null };

export function StoryViewer({
  groups,
  startGroup,
  onClose,
}: {
  groups: StoryGroup[];
  startGroup: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [gi, setGi] = useState(startGroup);
  const [si, setSi] = useState(0);
  const [viewers, setViewers] = useState<Viewer[] | null>(null);
  const seen = useRef<Set<string>>(new Set());

  const group = groups[gi];
  const story = group?.stories[si];

  const advance = useCallback(() => {
    setViewers(null);
    if (!group) return onClose();
    if (si < group.stories.length - 1) {
      setSi(si + 1);
    } else if (gi < groups.length - 1) {
      setGi(gi + 1);
      setSi(0);
    } else {
      onClose();
    }
  }, [gi, si, group, groups.length, onClose]);

  const back = () => {
    setViewers(null);
    if (si > 0) setSi(si - 1);
    else if (gi > 0) {
      const prev = gi - 1;
      setGi(prev);
      setSi(groups[prev].stories.length - 1);
    }
  };

  // Отмечаем просмотр и запускаем авто-переход.
  useEffect(() => {
    if (!story) return;
    if (!group.isMine && !seen.current.has(story.id)) {
      seen.current.add(story.id);
      viewStory(story.id).then(() => router.refresh());
    }
    const timer = setTimeout(advance, STORY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi, si]);

  // Клавиши: ← → Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance();
      else if (e.key === "ArrowLeft") back();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!group || !story) return null;

  const openViewers = async () => {
    const list = await fetchStoryViewers(story.id);
    setViewers(list);
  };

  const onDelete = async () => {
    await removeStory(story.id);
    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="relative flex h-full w-full max-w-md flex-col">
        {/* Прогресс-бары */}
        <div className="flex gap-1 p-3">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{
                  width: i < si ? "100%" : i === si ? "100%" : "0%",
                  animation:
                    i === si ? `story-progress ${STORY_MS}ms linear forwards` : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Шапка */}
        <div className="flex items-center gap-2 px-4 text-white">
          <Avatar
            src={group.author.avatarUrl}
            name={group.author.displayName}
            size={36}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {group.author.displayName}
            </div>
            <div className="text-xs text-white/70">{timeAgo(story.createdAt)}</div>
          </div>
          <button
            onClick={onClose}
            className="px-2 text-2xl leading-none text-white/80 hover:text-white"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Картинка + зоны навигации */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.imageUrl}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
          <button
            onClick={back}
            aria-label="Назад"
            className="absolute left-0 top-0 h-full w-1/3 cursor-default"
          />
          <button
            onClick={advance}
            aria-label="Вперёд"
            className="absolute right-0 top-0 h-full w-1/3 cursor-default"
          />
          {story.caption && (
            <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/50 px-3 py-2 text-center text-sm text-white">
              {story.caption}
            </div>
          )}
        </div>

        {/* Низ: для своих — просмотры и удаление */}
        {group.isMine && (
          <div className="flex items-center gap-3 p-4 text-white">
            <button onClick={openViewers} className="text-sm text-white/90">
              👁 {story.viewsCount}{" "}
              {story.viewsCount === 1 ? "просмотр" : "просмотров"}
            </button>
            <button
              onClick={onDelete}
              className="ml-auto text-sm text-red-400 hover:text-red-300"
            >
              Удалить
            </button>
          </div>
        )}

        {/* Список просмотревших */}
        {viewers && (
          <div className="absolute inset-x-0 bottom-0 max-h-[50%] overflow-y-auto rounded-t-2xl bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">
                Просмотры · {viewers.length}
              </span>
              <button onClick={() => setViewers(null)} className="text-muted">
                ✕
              </button>
            </div>
            {viewers.length === 0 ? (
              <p className="text-sm text-muted">Пока никто не посмотрел.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {viewers.map((v) => (
                  <div key={v.username} className="flex items-center gap-2">
                    <Avatar src={v.avatarUrl} name={v.displayName} size={32} />
                    <span className="text-sm">{v.displayName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
