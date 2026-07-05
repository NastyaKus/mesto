import Link from "next/link";
import { Fragment, type ReactNode } from "react";

// Разбивает текст на слова и оборачивает @username и #хэштег в ссылки.
// Захватывающая группа в split сохраняет разделители в массиве.
const TOKEN = /(@[a-zA-Z0-9_]+|#[\p{L}0-9_]+)/gu;

export function renderRichText(text: string): ReactNode {
  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith("@") && part.length > 1) {
      return (
        <Link
          key={i}
          href={`/profile/${part.slice(1)}`}
          className="font-medium text-brand hover:underline"
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith("#") && part.length > 1) {
      return (
        <Link
          key={i}
          href={`/search?q=${encodeURIComponent(part)}`}
          className="font-medium text-brand hover:underline"
        >
          {part}
        </Link>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
