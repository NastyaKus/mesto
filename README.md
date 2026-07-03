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
2. Environment Variables: `DATABASE_URL` (тот же Neon) и `AUTH_SECRET` (`npx auth secret`).
3. Deploy. Миграции применяются автоматически — скрипт `vercel-build` выполняет `prisma migrate deploy && next build`.

### Загрузка картинок (Vercel Blob)

Роут `api/upload` работает гибридно: локально пишет в `public/uploads`, а в проде — в **Vercel Blob** (если задан `BLOB_READ_WRITE_TOKEN`).

Чтобы включить на Vercel: **Storage → Create Database → Blob → Connect** к проекту. Vercel сам добавит `BLOB_READ_WRITE_TOKEN` в переменные окружения. После этого сделайте Redeploy — загрузка файлов заработает. (Вставка по ссылке работает и без Blob.)

## Обновления

Проект деплоится из GitHub — Vercel следит за веткой `main`:

```bash
git add -A
git commit -m "что изменил"
git push
```

Push в `main` → Vercel автоматически пересобирает и публикует прод. Пуш в другую ветку / Pull Request → создаётся **Preview**-деплой с отдельной ссылкой (прод не трогается). Изменения в схеме БД накатываются миграцией: создайте её локально `npm run db:migrate`, закоммитьте папку `prisma/migrations`, и `vercel-build` применит её на проде.

## Технические заметки

- Реалтайм сообщений — на поллинге (опрос раз в 2 с), без внешних сервисов; позже можно заменить на WebSocket/Pusher/Ably.
- Prisma закреплена на v6 (в v7 убрали классическую схему с `url`).
