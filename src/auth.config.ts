import type { NextAuthConfig } from "next-auth";

// Edge-safe базовая конфигурация (без Prisma/bcrypt) — используется в middleware.
export const authConfig = {
  // Доверяем host за обратным прокси (нужно для деплоя на Vercel/др.).
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [], // провайдеры добавляются в auth.ts (node runtime)
  callbacks: {
    // Контроль доступа к страницам на уровне middleware.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // Офлайн-заглушку service worker должен кэшировать как есть (а не редирект
      // на логин), поэтому она доступна без авторизации.
      if (nextUrl.pathname === "/offline") return true;

      const authPages = ["/login", "/register"];
      const isOnAuthPage = authPages.some((p) =>
        nextUrl.pathname.startsWith(p),
      );

      if (isOnAuthPage) {
        // Залогиненного со страниц входа/регистрации отправляем в ленту.
        if (isLoggedIn) {
          return Response.redirect(new URL("/feed", nextUrl));
        }
        return true;
      }

      // Все остальные (защищённые) страницы требуют логина.
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = user.username;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
