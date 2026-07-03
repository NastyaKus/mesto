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
    bio: formData.get("bio"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { displayName, bio, avatarUrl } = parsed.data;
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      displayName,
      bio: bio || null,
      avatarUrl: avatarUrl || null,
    },
    select: { username: true },
  });

  revalidatePath(`/profile/${user.username}`);
  return { error: undefined };
}
