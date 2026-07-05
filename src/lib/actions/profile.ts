"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { profileUpdateSchema } from "@/lib/validations";
import type { ActionState } from "@/lib/actions/auth";

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Не авторизован" };

  const parsed = profileUpdateSchema.safeParse({
    displayName: formData.get("displayName"),
    status: formData.get("status"),
    bio: formData.get("bio"),
    location: formData.get("location"),
    website: formData.get("website"),
    avatarUrl: formData.get("avatarUrl"),
    coverUrl: formData.get("coverUrl"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { displayName, status, bio, location, website, avatarUrl, coverUrl } =
    parsed.data;
  // Чекбокс: приходит "on" когда включён, иначе отсутствует.
  const isPrivate = formData.get("isPrivate") === "on";
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      displayName,
      status: status || null,
      bio: bio || null,
      location: location || null,
      website: website || null,
      avatarUrl: avatarUrl || null,
      coverUrl: coverUrl || null,
      isPrivate,
    },
    select: { username: true },
  });

  revalidatePath(`/profile/${user.username}`);
  return { error: undefined };
}
