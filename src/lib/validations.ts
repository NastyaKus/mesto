import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  username: z
    .string()
    .min(3, "Минимум 3 символа")
    .max(20, "Максимум 20 символов")
    .regex(/^[a-zA-Z0-9_]+$/, "Только латиница, цифры и _"),
  displayName: z.string().min(1, "Укажите имя").max(50, "Слишком длинное имя"),
  password: z.string().min(6, "Минимум 6 символов").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, "Укажите имя").max(50),
  bio: z.string().max(500, "Максимум 500 символов").nullish(),
  // Абсолютный URL (https://…) или относительный путь загрузки (/uploads/…).
  avatarUrl: z
    .string()
    .refine((v) => /^(https?:\/\/|\/)/.test(v), "Некорректная ссылка")
    .or(z.literal(""))
    .nullish(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
