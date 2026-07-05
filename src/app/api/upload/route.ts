import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";
import { auth } from "@/auth";

const MAX_BYTES = 5 * 1024 * 1024; // 5 МБ
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

// Загрузка изображения.
// На Vercel (есть BLOB_READ_WRITE_TOKEN) — в Vercel Blob.
// Локально — на диск в public/uploads. Возвращает URL картинки.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Поддерживаются только JPG, PNG, GIF, WEBP" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Файл больше 5 МБ" }, { status: 400 });
    }

    const name = `${randomBytes(12).toString("hex")}.${ext}`;

    // Прод: облачное хранилище Vercel Blob.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`uploads/${name}`, file, {
        access: "public",
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url });
    }

    // На Vercel без Blob запись на диск невозможна (ФС только для чтения).
    if (process.env.VERCEL) {
      return NextResponse.json(
        {
          error:
            "Хранилище картинок не подключено. Включите Vercel Blob в настройках проекта или вставьте картинку по ссылке.",
        },
        { status: 503 },
      );
    }

    // Локальная разработка: пишем на диск.
    const buffer = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buffer);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (err) {
    console.error("upload error:", err);
    // Показываем реальный текст ошибки, чтобы было видно причину.
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Ошибка: ${detail}` },
      { status: 500 },
    );
  }
}
