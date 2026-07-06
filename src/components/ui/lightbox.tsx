"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  src?: string; // одиночная картинка (обратная совместимость)
  images?: string[]; // галерея из нескольких картинок
  index?: number; // стартовый индекс галереи
  alt?: string;
  className?: string; // стили превью-картинки
  // Если превью не нужно (открываем программно) — можно рендерить только оверлей.
  children?: React.ReactNode;
};

const MAX_SCALE = 4;
const MIN_SCALE = 1;

// Картинка-превью с полноэкранным просмотром: зум (колесо/двойной клик),
// панорама перетаскиванием, свайп вниз для закрытия, галерея со стрелками.
export function Lightbox({ src, images, index = 0, alt = "", className }: Props) {
  const list = images && images.length > 0 ? images : src ? [src] : [];
  const thumb = src ?? list[index] ?? "";

  const [open, setOpen] = useState(false);
  const [i, setI] = useState(index);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [dismiss, setDismiss] = useState(0); // вертикальный сдвиг при свайпе-закрытии
  const imgRef = useRef<HTMLImageElement>(null);

  const current = list[i] ?? thumb;
  const reset = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setDismiss(0);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const go = useCallback(
    (dir: number) => {
      if (list.length < 2) return;
      setI((v) => (v + dir + list.length) % list.length);
      reset();
    },
    [list.length, reset],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") setScale((s) => Math.min(MAX_SCALE, s + 0.5));
      else if (e.key === "-") setScale((s) => Math.max(MIN_SCALE, s - 0.5));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, go]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s - e.deltaY * 0.002)));
  };

  const onDoubleClick = () => {
    if (scale > 1) reset();
    else setScale(2.5);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    if (scale > 1) {
      // Панорама увеличенной картинки.
      setPan({ x: e.clientX - drag.x, y: e.clientY - drag.y });
    } else {
      // Свайп вниз (или вверх) для закрытия.
      setDismiss(e.clientY - (drag.y + pan.y));
    }
  };

  const onPointerUp = () => {
    setDrag(null);
    if (scale <= 1 && Math.abs(dismiss) > 110) close();
    else setDismiss(0);
  };

  return (
    <>
      <img
        src={thumb}
        alt={alt}
        onClick={() => {
          setI(index);
          setOpen(true);
        }}
        className={`cursor-zoom-in ${className ?? ""}`}
      />

      {open && (
        <div
          onClick={close}
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          {/* Тулбар */}
          <div
            className="absolute top-4 right-4 z-10 flex gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {scale > 1 && (
              <button
                onClick={reset}
                aria-label="Сбросить зум"
                className="press flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white transition hover:bg-white/20"
              >
                ⤢
              </button>
            )}
            <a
              href={current}
              download
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Скачать"
              className="press flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white transition hover:bg-white/20"
            >
              ⭳
            </a>
            <button
              onClick={close}
              aria-label="Закрыть"
              className="press flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
            >
              ✕
            </button>
          </div>

          {/* Стрелки галереи */}
          {list.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                aria-label="Предыдущая"
                className="press absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); go(1); }}
                aria-label="Следующая"
                className="press absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
              >
                ›
              </button>
            </>
          )}

          {/* Картинка */}
          <img
            ref={imgRef}
            src={current}
            alt={alt}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onWheel={onWheel}
            onDoubleClick={onDoubleClick}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="animate-scale-in max-h-[90vh] max-w-full touch-none rounded-lg object-contain select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y + dismiss}px) scale(${scale})`,
              opacity: 1 - Math.min(Math.abs(dismiss) / 400, 0.6),
              cursor: scale > 1 ? "grab" : "zoom-out",
              transition: drag ? "none" : "transform 0.2s var(--ease-out), opacity 0.2s ease",
            }}
          />

          {/* Точки-индикаторы */}
          {list.length > 1 && (
            <div
              className="absolute bottom-4 flex gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {list.map((_, k) => (
                <span
                  key={k}
                  className={`h-1.5 rounded-full transition-all ${
                    k === i ? "w-5 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
