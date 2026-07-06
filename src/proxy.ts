import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Проверка доступа к страницам (Next 16 «proxy», ранее «middleware»).
// Используем edge-safe конфиг без Prisma.
export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  // Прогоняем всё, кроме статики, картинок и API (роуты авторизуют сами:
  // веб — по cookie-сессии, мобильный /api/v1 — по Bearer-токену).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
