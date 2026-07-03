import type { DefaultSession } from "next-auth";

// Расширяем стандартные типы сессии/токена нашими полями.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
  }
}
