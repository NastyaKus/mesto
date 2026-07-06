import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";

// Токен-авторизация для мобильного клиента (Bearer). Подписываем тем же
// секретом, что и веб-сессии (AUTH_SECRET), но это отдельный JWT для API.

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);
const TOKEN_TTL = "60d";

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secret());
}

/** Достаёт userId из заголовка Authorization: Bearer <token>. null — если нет/невалиден. */
export async function getBearerUserId(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

// ── CORS ──────────────────────────────────────────────────────────────────
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/** Ответ на preflight OPTIONS. */
export function corsPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** JSON-ответ с CORS-заголовками. */
export function json(data: unknown, init?: { status?: number }): NextResponse {
  return NextResponse.json(data as object, {
    status: init?.status ?? 200,
    headers: CORS_HEADERS,
  });
}

/** Быстрый 401 с CORS. */
export function unauthorized(): NextResponse {
  return json({ error: "Не авторизован" }, { status: 401 });
}

/** Хелпер: требует токен, возвращает userId или бросает Response-ошибку через null. */
export async function requireUserId(req: Request): Promise<string | null> {
  return getBearerUserId(req);
}
