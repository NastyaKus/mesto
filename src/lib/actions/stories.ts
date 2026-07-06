"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createStory,
  markStoryViewed,
  getStoryViewers,
  deleteStoryById,
} from "@/lib/stories";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

/** Опубликовать историю (картинка обязательна). */
export async function postStory(imageUrl: string, caption?: string) {
  const userId = await requireUserId();
  const image = imageUrl.trim();
  if (!image) return;
  await createStory(userId, image, caption);
  revalidatePath("/feed");
}

/** Отметить историю просмотренной. */
export async function viewStory(storyId: string) {
  const userId = await requireUserId();
  await markStoryViewed(storyId, userId);
}

/** Кто просмотрел историю (только автору). */
export async function fetchStoryViewers(storyId: string) {
  const userId = await requireUserId();
  return getStoryViewers(storyId, userId);
}

/** Удалить свою историю. */
export async function removeStory(storyId: string) {
  const userId = await requireUserId();
  await deleteStoryById(storyId, userId);
  revalidatePath("/feed");
}
