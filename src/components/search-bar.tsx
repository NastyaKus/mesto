"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Поиск людей: сабмит ведёт на /friends?q=...
export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        router.push(query ? `/friends?q=${encodeURIComponent(query)}` : "/friends");
      }}
      className="w-full max-w-md"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍  Поиск людей…"
        className="input !rounded-full text-sm"
      />
    </form>
  );
}
