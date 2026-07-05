"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";

type Props = {
  name: string; // имя скрытого поля, которое уйдёт в форму
  defaultValue?: string | null;
};

// Выбор изображения: загрузка файла с превью либо вставка ссылки.
// Итоговый URL кладётся в скрытый input name={name}.
export function ImagePicker({ name, defaultValue }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });

      // Ответ может быть пустым или не-JSON (например, при 500/редиректе) —
      // читаем как текст и аккуратно пробуем распарсить.
      const raw = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.error ?? `Ошибка загрузки (${res.status})`);
      }
      if (!data.url) {
        throw new Error("Сервер вернул пустой ответ");
      }
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mt-2">
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative w-fit">
          <img
            src={url}
            alt="Превью"
            className="max-h-48 rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute top-1 right-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
          >
            ✕ убрать
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-ghost px-3 py-1.5 text-sm"
            >
              {uploading ? "Загрузка…" : "📎 Выбрать файл"}
            </button>
            <span className="text-xs text-muted">до 5 МБ</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />
          <input
            type="url"
            placeholder="…или вставьте ссылку на картинку"
            onChange={(e) => setUrl(e.target.value)}
            className="input text-sm"
          />
        </div>
      )}
      {error && <p className="mt-1 text-xs text-like">{error}</p>}
    </div>
  );
}
