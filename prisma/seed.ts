import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Пара тестовых пользователей: пароль у всех — "password".
async function main() {
  const passwordHash = await bcrypt.hash("password", 10);

  const users = [
    { email: "ivan@example.com", username: "ivan", displayName: "Иван Иванов" },
    { email: "maria@example.com", username: "maria", displayName: "Мария Петрова" },
    { email: "alex@example.com", username: "alex", displayName: "Алексей Смирнов" },
  ];

  const created: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
    created[u.username] = user.id;
  }

  // Дружбы: ivan ↔ maria, ivan ↔ alex (принятые).
  const friendships = [
    { requesterId: created.ivan, addresseeId: created.maria },
    { requesterId: created.ivan, addresseeId: created.alex },
  ];
  for (const f of friendships) {
    await prisma.friendship.upsert({
      where: {
        requesterId_addresseeId: {
          requesterId: f.requesterId,
          addresseeId: f.addresseeId,
        },
      },
      update: { status: "ACCEPTED" },
      create: { ...f, status: "ACCEPTED" },
    });
  }

  // Демо-посты (только если постов ещё нет).
  const postCount = await prisma.post.count();
  if (postCount === 0) {
    await prisma.post.createMany({
      data: [
        {
          authorId: created.maria,
          content: "Привет, mesto! Первый пост в новой соцсети 🎉",
        },
        {
          authorId: created.alex,
          content: "Сегодня отличная погода для прогулки ☀️",
        },
        {
          authorId: created.ivan,
          content: "Тестируем ленту. Ставьте лайки и комментируйте! 👇",
        },
      ],
    });
  }

  // Демо-сообщество (если ещё нет).
  const demoSlug = "mesto-team-demo";
  const existingGroup = await prisma.group.findUnique({
    where: { slug: demoSlug },
  });
  if (!existingGroup) {
    const group = await prisma.group.create({
      data: {
        slug: demoSlug,
        name: "Команда mesto",
        description: "Официальное сообщество — новости и анонсы.",
        ownerId: created.ivan,
        members: {
          create: [
            { userId: created.ivan, role: "OWNER" },
            { userId: created.maria, role: "ADMIN" },
            { userId: created.alex, role: "MEMBER" },
          ],
        },
      },
    });
    await prisma.post.create({
      data: {
        authorId: created.ivan,
        groupId: group.id,
        content: "Добро пожаловать в mesto! Здесь мы делимся новостями 🚀",
      },
    });
  }

  console.log("Seed завершён. Логин любым email, пароль: password");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
