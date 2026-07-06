"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Lightbox } from "@/components/ui/lightbox";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { presenceLabel } from "@/lib/format";
import type { ChatMessage, ParticipantState } from "@/lib/messages";
import {
  sendMessage,
  setMessageReaction,
  editMessage,
  deleteMessage,
} from "@/lib/actions/messages";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const POLL_MS = 2000;
const TYPING_THROTTLE_MS = 3000;

type LocalMsg = ChatMessage & { pending?: boolean };

type HeaderUser = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type Props = {
  conversationId: string;
  meId: string;
  isGroup: boolean;
  title: string;
  groupAvatar: string | null;
  headerUser: HeaderUser | null;
  initialMessages: ChatMessage[];
  initialParticipants: ParticipantState[];
};

export function ChatWindow({
  conversationId,
  meId,
  isGroup,
  title,
  groupAvatar,
  headerUser,
  initialMessages,
  initialParticipants,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [pending, setPending] = useState<LocalMsg[]>([]);
  const [participants, setParticipants] =
    useState<ParticipantState[]>(initialParticipants);
  const [text, setText] = useState("");
  const [attached, setAttached] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage["replyTo"] | null>(null);
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(
    null,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastTypingSent = useRef(0);

  // Карта участников по id — для имён/аватаров отправителей в группах.
  const byId = useMemo(() => {
    const m = new Map<string, ParticipantState>();
    for (const p of participants) m.set(p.userId, p);
    return m;
  }, [participants]);

  const others = participants.filter((p) => p.userId !== meId);

  // Поллинг: полный свежий список сообщений + состояние участников.
  const poll = async () => {
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages`,
      );
      if (!res.ok) return;
      const data: { messages: ChatMessage[]; participants: ParticipantState[] } =
        await res.json();
      setMessages(data.messages);
      setParticipants(data.participants);
    } catch {
      // сеть моргнула — попробуем на следующем тике
    }
  };

  useEffect(() => {
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Автопрокрутка вниз при изменении ленты.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  const signalTyping = () => {
    const now = Date.now();
    if (now - lastTypingSent.current < TYPING_THROTTLE_MS) return;
    lastTypingSent.current = now;
    fetch(`/api/conversations/${conversationId}/typing`, {
      method: "POST",
    }).catch(() => {});
  };

  const onAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (res.ok && data.url) setAttached(data.url);
    } catch {
      // молча игнорируем — пользователь попробует снова
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    const image = attached;
    if (!value && !image) return;
    const reply = replyTo;
    setText("");
    setAttached(null);
    setReplyTo(null);

    const tempId = `temp-${Date.now()}`;
    const temp: LocalMsg = {
      id: tempId,
      senderId: meId,
      content: value,
      imageUrl: image,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deleted: false,
      reactions: [],
      myReaction: null,
      replyTo: reply,
      pending: true,
    };
    setPending((p) => [...p, temp]);

    await sendMessage(conversationId, value, image ?? undefined, reply?.id);
    await poll();
    setPending((p) => p.filter((m) => m.id !== tempId));
  };

  const react = async (messageId: string, emoji: string) => {
    // Оптимистично патчим локально, затем синхронизируемся.
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? patchReaction(m, emoji, meId) : m)),
    );
    await setMessageReaction(messageId, emoji);
    poll();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const value = editing.content.trim();
    const id = editing.id;
    setEditing(null);
    if (!value) return;
    await editMessage(id, value);
    poll();
  };

  const remove = async (id: string) => {
    await deleteMessage(id);
    poll();
  };

  // Сколько собеседников прочитали сообщение (по времени отправки).
  const readByCount = (createdAt: string) => {
    const t = Date.parse(createdAt);
    return others.filter((p) => p.lastReadAt && Date.parse(p.lastReadAt) >= t)
      .length;
  };

  const typingNames = others
    .filter((p) => p.typing)
    .map((p) => p.displayName);
  const subtitle = subtitleFor(isGroup, participants.length, headerUser, others, typingNames);

  const all: LocalMsg[] = [...messages, ...pending];

  return (
    <div className="card flex h-[calc(100dvh-12rem)] flex-col overflow-hidden md:h-[calc(100vh-8rem)]">
      {/* Шапка беседы */}
      <div className="flex items-center gap-3 border-b border-border p-3">
        {isGroup ? (
          <Avatar src={groupAvatar} name={title} size={40} />
        ) : (
          headerUser && (
            <Avatar
              src={headerUser.avatarUrl}
              name={headerUser.displayName}
              size={40}
              online={others[0]?.online ?? false}
            />
          )
        )}
        <div className="min-w-0">
          <div className="truncate font-semibold">{title}</div>
          <div className="truncate text-xs text-muted">{subtitle}</div>
        </div>
        {!isGroup && headerUser && (
          <Link
            href={`/profile/${headerUser.username}`}
            className="btn-ghost ml-auto px-3 py-1.5 text-sm"
          >
            Профиль
          </Link>
        )}
        {isGroup && (
          <Link
            href={`/messages/${conversationId}/info`}
            className="btn-ghost ml-auto px-3 py-1.5 text-sm"
          >
            Участники
          </Link>
        )}
      </div>

      {/* Лента сообщений */}
      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto p-4">
        {all.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted">
            Пока нет сообщений. Напишите первым!
          </p>
        )}
        {all.map((m) => (
          <MessageRow
            key={m.id}
            m={m}
            mine={m.senderId === meId}
            isGroup={isGroup}
            sender={byId.get(m.senderId)}
            reactionsAllowed={REACTIONS}
            onReact={(emoji) => react(m.id, emoji)}
            onReply={() =>
              setReplyTo({
                id: m.id,
                author: byId.get(m.senderId)?.displayName ?? "",
                preview: m.content.slice(0, 80) || "📷 Фото",
              })
            }
            onEdit={() => setEditing({ id: m.id, content: m.content })}
            onDelete={() => remove(m.id)}
            receipt={
              m.senderId === meId && !m.pending && !m.deleted
                ? receiptFor(isGroup, readByCount(m.createdAt))
                : null
            }
          />
        ))}
      </div>

      {typingNames.length > 0 && (
        <div className="px-4 pb-1 text-xs text-muted">
          {typingLabel(isGroup, typingNames)}
        </div>
      )}

      {/* Панель ответа */}
      {replyTo && (
        <div className="flex items-center gap-2 border-t border-border px-3 pt-2 text-sm">
          <span className="text-brand">↩</span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium">{replyTo.author}</div>
            <div className="truncate text-xs text-muted">{replyTo.preview}</div>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="text-muted hover:text-like"
          >
            ✕
          </button>
        </div>
      )}

      {/* Превью прикреплённой картинки */}
      {attached && (
        <div className="flex items-center gap-2 border-t border-border px-3 pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attached} alt="" className="h-14 w-14 rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => setAttached(null)}
            className="text-sm text-muted hover:text-like"
          >
            ✕ убрать
          </button>
        </div>
      )}

      {/* Редактирование */}
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveEdit();
          }}
          className="flex gap-2 border-t border-border p-3"
        >
          <input
            value={editing.content}
            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            className="input"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="btn-ghost px-3 py-2"
          >
            ✕
          </button>
          <button type="submit" className="btn-primary px-5 py-2">
            ОК
          </button>
        </form>
      ) : (
        /* Поле ввода */
        <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onAttach}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Прикрепить картинку"
            className="btn-ghost px-3 py-2"
          >
            {uploading ? <span className="spinner" /> : "📎"}
          </button>
          <EmojiPicker onPick={(e) => setText((t) => t + e)} />
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              signalTyping();
            }}
            placeholder="Написать сообщение…"
            className="input"
            autoFocus
          />
          <button type="submit" className="btn-primary px-5 py-2">
            →
          </button>
        </form>
      )}
    </div>
  );
}

// Локально пересчитывает реакцию сообщения (оптимистично, до синхронизации).
function patchReaction(
  m: ChatMessage,
  emoji: string,
  meId: string,
): ChatMessage {
  const map = new Map(m.reactions.map((r) => [r.emoji, r.count]));
  const bump = (e: string, d: number) =>
    map.set(e, Math.max(0, (map.get(e) ?? 0) + d));
  let myReaction: string | null;
  if (m.myReaction === emoji) {
    bump(emoji, -1);
    myReaction = null;
  } else if (m.myReaction) {
    bump(m.myReaction, -1);
    bump(emoji, 1);
    myReaction = emoji;
  } else {
    bump(emoji, 1);
    myReaction = emoji;
  }
  void meId;
  const reactions = [...map.entries()]
    .filter(([, c]) => c > 0)
    .map(([e, c]) => ({ emoji: e, count: c }))
    .sort((a, b) => b.count - a.count);
  return { ...m, reactions, myReaction };
}

function receiptFor(isGroup: boolean, readBy: number): string {
  if (isGroup) return readBy > 0 ? `✓✓ ${readBy}` : "✓";
  return readBy > 0 ? "✓✓" : "✓";
}

function subtitleFor(
  isGroup: boolean,
  count: number,
  headerUser: HeaderUser | null,
  others: ParticipantState[],
  typingNames: string[],
): string {
  if (typingNames.length > 0) return typingLabel(isGroup, typingNames);
  if (isGroup) return `${count} ${plural(count, "участник", "участника", "участников")}`;
  const other = others[0];
  if (!other) return headerUser ? `@${headerUser.username}` : "";
  return presenceLabel(other.lastSeenAt, other.online);
}

function typingLabel(isGroup: boolean, names: string[]): string {
  if (!isGroup) return "печатает…";
  if (names.length === 1) return `${names[0]} печатает…`;
  return `${names.slice(0, 2).join(", ")} печатают…`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

// ─── Одно сообщение ───────────────────────────────────────────────────────

function MessageRow({
  m,
  mine,
  isGroup,
  sender,
  reactionsAllowed,
  onReact,
  onReply,
  onEdit,
  onDelete,
  receipt,
}: {
  m: LocalMsg;
  mine: boolean;
  isGroup: boolean;
  sender: ParticipantState | undefined;
  reactionsAllowed: string[];
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  receipt: string | null;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (m.deleted) {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[75%] rounded-2xl bg-surface-2 px-3 py-2 text-sm text-muted italic">
          сообщение удалено
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[80%] flex-col">
        <div
          className={`rounded-2xl text-sm ${
            mine ? "bg-brand-gradient text-white" : "bg-surface-2 text-foreground"
          } ${m.pending ? "opacity-70" : ""}`}
        >
          {/* Имя отправителя в группе (для чужих сообщений) */}
          {isGroup && !mine && sender && (
            <span className="block px-3 pt-1.5 text-xs font-semibold text-brand">
              {sender.displayName}
            </span>
          )}

          {/* Цитата */}
          {m.replyTo && (
            <div
              className={`mx-2 mt-1.5 rounded-lg border-l-2 px-2 py-1 text-xs ${
                mine ? "border-white/60 bg-white/10" : "border-brand bg-surface"
              }`}
            >
              <div className="font-medium">{m.replyTo.author}</div>
              <div className="truncate opacity-80">{m.replyTo.preview}</div>
            </div>
          )}

          {m.imageUrl && (
            <Lightbox src={m.imageUrl} className="max-h-64 w-full object-cover" />
          )}
          {m.content && (
            <span className="block px-3 py-2 whitespace-pre-wrap break-words">
              {m.content}
              {m.editedAt && (
                <span
                  className={`ml-1 text-xs ${mine ? "text-white/70" : "text-muted"}`}
                >
                  (изменено)
                </span>
              )}
            </span>
          )}
        </div>

        {/* Реакции под пузырём */}
        {m.reactions.length > 0 && (
          <div className={`mt-0.5 flex flex-wrap gap-1 ${mine ? "justify-end" : ""}`}>
            {m.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact(r.emoji)}
                className={`rounded-full border px-1.5 py-0.5 text-xs ${
                  m.myReaction === r.emoji
                    ? "border-brand bg-surface-2"
                    : "border-border bg-surface"
                }`}
              >
                {r.emoji} {r.count}
              </button>
            ))}
          </div>
        )}

        {/* Компактные контролы под сообщением (в обычном потоке — не обрезаются). */}
        {!m.pending && (
          <div
            className={`mt-0.5 flex items-center gap-2 text-xs text-muted ${
              mine ? "justify-end" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setShowPicker((v) => !v);
                setShowMenu(false);
              }}
              className="hover:text-brand"
              title="Реакция"
            >
              🙂
            </button>
            <button
              type="button"
              onClick={onReply}
              className="hover:text-brand"
              title="Ответить"
            >
              ↩
            </button>
            {mine && (
              <button
                type="button"
                onClick={() => {
                  setShowMenu((v) => !v);
                  setShowPicker(false);
                }}
                className="hover:text-brand"
                title="Ещё"
              >
                ⋯
              </button>
            )}
            {receipt && (
              <span className="text-muted" title="прочитано">
                {receipt}
              </span>
            )}
          </div>
        )}

        {/* Инлайн-пикер реакций */}
        {showPicker && (
          <div
            className={`animate-fade-in mt-1 flex gap-1 rounded-full border border-border bg-surface p-1 shadow-sm ${
              mine ? "self-end" : "self-start"
            }`}
          >
            {reactionsAllowed.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  setShowPicker(false);
                  onReact(e);
                }}
                className="rounded-full p-0.5 text-lg transition-transform hover:scale-125"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Инлайн-меню своих сообщений */}
        {showMenu && mine && (
          <div className="animate-fade-in mt-1 flex gap-3 self-end text-xs">
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onEdit();
              }}
              className="hover:text-brand"
            >
              Изменить
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onDelete();
              }}
              className="text-like hover:opacity-80"
            >
              Удалить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
