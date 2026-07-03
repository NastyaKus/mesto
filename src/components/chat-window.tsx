"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { sendMessage } from "@/lib/actions/messages";

type Msg = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  pending?: boolean;
};

type Props = {
  conversationId: string;
  meId: string;
  other: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  initialMessages: Msg[];
};

const POLL_MS = 2000;

export function ChatWindow({
  conversationId,
  meId,
  other,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  // Время последнего «настоящего» сообщения — курсор для поллинга.
  const lastRealTime = useRef<string>(
    initialMessages.at(-1)?.createdAt ?? new Date(0).toISOString(),
  );

  // Автопрокрутка вниз при появлении новых сообщений.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Поллинг новых сообщений.
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages?after=${encodeURIComponent(
            lastRealTime.current,
          )}`,
        );
        if (!res.ok || !active) return;
        const data: { messages: Msg[] } = await res.json();
        if (data.messages.length === 0) return;

        lastRealTime.current = data.messages.at(-1)!.createdAt;
        setMessages((prev) => {
          // Убираем оптимистичные заглушки и добавляем реальные новые.
          const confirmed = prev.filter((m) => !m.pending);
          const known = new Set(confirmed.map((m) => m.id));
          const fresh = data.messages.filter((m) => !known.has(m.id));
          return [...confirmed, ...fresh];
        });
      } catch {
        // сеть моргнула — попробуем на следующем тике
      }
    };
    const timer = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [conversationId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");

    // Оптимистично показываем своё сообщение сразу.
    const temp: Msg = {
      id: `temp-${Date.now()}`,
      senderId: meId,
      content: value,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, temp]);

    await sendMessage(conversationId, value);
  };

  return (
    <div className="card flex h-[calc(100dvh-12rem)] flex-col overflow-hidden md:h-[calc(100vh-8rem)]">
      {/* Шапка диалога */}
      <Link
        href={`/profile/${other.username}`}
        className="flex items-center gap-3 border-b border-border p-3 hover:bg-surface-2"
      >
        <Avatar src={other.avatarUrl} name={other.displayName} size={40} />
        <div>
          <div className="font-semibold">{other.displayName}</div>
          <div className="text-xs text-muted">@{other.username}</div>
        </div>
      </Link>

      {/* Лента сообщений */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted">
            Пока нет сообщений. Напишите первым!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`animate-fade-up max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-brand-gradient text-white"
                    : "bg-surface-2 text-foreground"
                } ${m.pending ? "opacity-70" : ""}`}
              >
                <span className="whitespace-pre-wrap break-words">
                  {m.content}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Поле ввода */}
      <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение…"
          className="input"
          autoFocus
        />
        <button type="submit" className="btn-primary px-5 py-2">
          →
        </button>
      </form>
    </div>
  );
}
