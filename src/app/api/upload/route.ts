import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { auth } from "@/auth";

const MAX_BYTES = 5 * 1024 * 1024; // 5 МБ
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

// Загрузка изображения: сохраняет файл в public/uploads и возвращает его URL.
// Примечание: для продакшна на serverless (Vercel) нужно облачное хранилище —
// локальная ФС там только для чтения. Для локальной разработки этого достаточно.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json(
      { error: "Файл больше 5 МБ" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);

  return NextResponse.json({ url: `/uploads/${name}` });
}
