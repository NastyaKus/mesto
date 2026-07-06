import { cookies } from "next/headers";

// Настройка темы: явная светлая/тёмная или «как в системе».
export type ThemePref = "light" | "dark" | "system";

// Читает выбор темы из cookie. По умолчанию — системная.
export async function getThemePref(): Promise<ThemePref> {
  const value = (await cookies()).get("theme")?.value;
  return value === "light" || value === "dark" ? value : "system";
}
