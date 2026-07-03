import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Проверка доступа к страницам (Next 16 «proxy», ранее «middleware»).
// Используем edge-safe конфиг без Prisma.
export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  // Прогоняем всё, кроме статики, картинок и api/auth.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
