import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { publicUserSelect } from "@/lib/friends";
import { signToken, json, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// POST /api/v1/auth/register → { token, user }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { error: "Некорректные данные", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { email, username, displayName, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true },
  });
  if (existing) {
    return json(
      { error: existing.email === email ? "Этот email уже занят" : "Этот логин уже занят" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, displayName, passwordHash },
    select: publicUserSelect,
  });
  const token = await signToken(user.id);
  return json({ token, user });
}
