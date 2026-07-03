# mesto — социальная сеть

Учебный проект соцсети в стиле ВКонтакте. Стек: **Next.js 16 (App Router, TypeScript)**, **Prisma + PostgreSQL**, **Auth.js (NextAuth v5)**, **Tailwind CSS**. Фирменный стиль — фиолетовый градиент, плавные анимации.

## Что уже работает (Фазы 0–5)

- Регистрация и вход (email + пароль, сессии на JWT).
- Профиль `/profile/[username]` с обложкой-градиентом + редактирование `/settings`.
- Поиск людей по имени/логину.
- Друзья: заявка → принять/отклонить → список друзей → удалить. `FriendButton` со всеми состояниями.
- **Лента и посты:** публикация (текст + картинка по ссылке), лайки (оптимистичные), комментарии, удаление своих постов, стена в профиле.
- **Личные сообщения:** диалоги 1-на-1, живое обновление через поллинг, оптимистичная отправка, счётчики непрочитанных, кнопка «Написать» в профиле.
- **Сообщества:** создание, вступление/выход, роли (владелец/админ/участник), посты от лица сообщества, посты сообществ в общей ленте.
- **Уведомления:** заявки в друзья, принятие, лайки и комментарии к вашим записям; бейдж непрочитанных.
- Интерфейс: верхний поиск + левый сайдбар, анимации появления и лайка.

## Быстрый старт

1. **Установить зависимости** (уже сделано):

   ```bash
   npm install
   ```

2. **Настроить базу.** Создайте бесплатную БД на [Neon](https://neon.tech) или [Supabase](https://supabase.com) и вставьте connection string в `.env`:

   ```
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
   ```

3. **Применить схему и создать тестовых пользователей:**

   ```bash
   npm run db:migrate      # создаст таблицы
   npm run db:seed         # 3 тестовых пользователя, пароль у всех: password
   ```

4. **Запустить:**

   ```bash
   npm run dev
   ```

   Открыть http://localhost:3000

## Тестовые аккаунты (после seed)

| Email | Пароль |
|-------|--------|
| ivan@example.com | password |
| maria@example.com | password |
| alex@example.com | password |

## Полезные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Дев-сервер |
| `npm run build` | Продакшн-сборка |
| `npm run db:migrate` | Миграции Prisma |
| `npm run db:studio` | GUI для базы (Prisma Studio) |
| `npm run db:seed` | Заполнить тестовыми данными |

## Структура

```
src/
  app/
    (auth)/login, register        — вход и регистрация
    (main)/feed                   — лента новостей
    (main)/friends                — друзья, заявки, поиск
    (main)/messages, [id]         — диалоги и чат
    (main)/groups, [slug]         — сообщества и их стены
    (main)/notifications          — уведомления
    (main)/profile/[username]     — профиль и стена
    (main)/settings               — редактирование профиля
    api/auth/[...nextauth]        — роут Auth.js
    api/conversations/[id]/...    — поллинг сообщений
    api/upload                    — загрузка картинок
  components/                     — UI-компоненты
  lib/
    actions/                      — server actions
    friends.ts, posts.ts, messages.ts, groups.ts, notifications.ts
    prisma.ts, session.ts         — клиент БД и текущий пользователь
  auth.ts, auth.config.ts         — конфигурация Auth.js
  proxy.ts                        — защита роутов
prisma/schema.prisma              — модель данных
```

## Деплой на Vercel

1. Запушьте репозиторий на GitHub, импортируйте проект в [Vercel](https://vercel.com/new).
2. В настройках проекта задайте переменные окружения: `DATABASE_URL` (тот же Neon) и `AUTH_SECRET` (сгенерируйте `npx auth secret`).
3. Vercel сам выполнит `npm run build`. Миграции примените локально (`npm run db:migrate`) или добавьте `prisma migrate deploy` в build-команду.

⚠️ **Загрузка картинок файлом** сейчас пишет в `public/uploads` — это работает локально, но **не на Vercel** (там файловая система только для чтения). Для продакшна замените роут `api/upload` на облачное хранилище (Vercel Blob, S3, UploadThing). Вставка картинок по ссылке работает везде.

## Технические заметки

- Реалтайм сообщений — на поллинге (опрос раз в 2 с), без внешних сервисов; позже можно заменить на WebSocket/Pusher/Ably.
- Prisma закреплена на v6 (в v7 убрали классическую схему с `url`).
