"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Единый поиск: люди, записи, сообщения. Сабмит ведёт на /search?q=...
export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
      }}
      className="w-full max-w-md"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍  Поиск людей, записей, сообщений…"
        className="input !rounded-full text-sm"
      />
    </form>
  );
}
