"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { registerSchema, loginSchema } from "@/lib/validations";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function registerUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, username, displayName, password } = parsed.data;

  // Проверяем уникальность email и username.
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    if (existing.email === email) {
      return { fieldErrors: { email: ["Этот email уже занят"] } };
    }
    return { fieldErrors: { username: ["Этот логин уже занят"] } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, username, displayName, passwordHash },
  });

  // Сразу логиним нового пользователя. signIn с redirectTo бросит redirect.
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/feed",
  });

  return {};
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}

export async function loginUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/feed",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Неверный email или пароль" };
    }
    // redirect() бросает специальную ошибку — её нужно пробросить дальше.
    throw error;
  }

  return {};
}
