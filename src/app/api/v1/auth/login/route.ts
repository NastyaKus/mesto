import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { publicUserSelect } from "@/lib/friends";
import { signToken, json, corsPreflight } from "@/lib/mobile-auth";

export function OPTIONS() {
  return corsPreflight();
}

// POST /api/v1/auth/login → { token, user }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Некорректные данные" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  const token = await signToken(user.id);
  const publicUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: publicUserSelect,
  });
  return json({ token, user: publicUser });
}
