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

const imageUrlField = z
  .string()
  .refine((v) => /^(https?:\/\/|\/)/.test(v), "Некорректная ссылка")
  .or(z.literal(""))
  .nullish();

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, "Укажите имя").max(50),
  status: z.string().max(100, "Максимум 100 символов").nullish(),
  bio: z.string().max(500, "Максимум 500 символов").nullish(),
  location: z.string().max(60, "Максимум 60 символов").nullish(),
  website: z.string().max(120).nullish(),
  // Абсолютный URL (https://…) или относительный путь загрузки (/uploads/…).
  avatarUrl: imageUrlField,
  coverUrl: imageUrlField,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
