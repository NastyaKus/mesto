"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt?: string;
  className?: string; // стили превью-картинки
};

// Картинка-превью, которая по клику открывается на весь экран.
export function Lightbox({ src, alt = "", className }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    // Блокируем прокрутку фона, пока открыт просмотр.
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        className={`cursor-zoom-in ${className ?? ""}`}
      />

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <button
            aria-label="Закрыть"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            ✕
          </button>
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
