# mesto — мобильное приложение (Android, Expo/React Native)

Нативный клиент mesto: **вход/регистрация, лента (смотреть/постить/реакции),
чаты (список, диалог, отправка, онлайн/«печатает…»)**. Работает поверх мобильного
API бэкенда (`/api/v1/*`, токен-авторизация).

## Стек
Expo (SDK 57) · React Native · TypeScript · react-native-svg · expo-secure-store.
Простая навигация без внешних зависимостей (`lib/nav.tsx`).

## Настройка API
Приложение обращается к бэкенду mesto. Адрес — через переменную
`EXPO_PUBLIC_API_URL` (по умолчанию боевой `https://mesto-vert.vercel.app`).

```bash
# локальный бэкенд для разработки:
EXPO_PUBLIC_API_URL=http://localhost:3201 npx expo start
```

> Мобильный API (`/api/v1/*`) должен быть задеплоен на бэкенде — он в этой же
> ветке. После мержа/деплоя приложение работает с боевым сервером без настроек.

## Запуск в разработке
```bash
cd mobile
npm install
npx expo start            # QR для Expo Go, либо клавиши a/i/w
npx expo start --web      # предпросмотр в браузере
```

## Сборка APK (для себя)

### Вариант 1 — EAS (облако Expo, проще всего)
```bash
npm i -g eas-cli          # или npx eas-cli ...
cd mobile
eas login                 # бесплатный аккаунт Expo
eas build -p android --profile preview
```
По окончании EAS даст ссылку на готовый `.apk` — скачать и установить на телефон
(включив «Установка из неизвестных источников»).

### Вариант 2 — локально (нужны Android SDK + JDK 17)
```bash
cd mobile
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## Структура
```
mobile/
  App.tsx            — провайдеры, вкладки (Лента/Чаты), presence-heartbeat
  lib/
    api.ts           — клиент /api/v1 + Bearer-токен
    auth.tsx         — контекст авторизации, токен в SecureStore
    storage.ts       — токен (SecureStore на нативе, localStorage на web)
    nav.tsx          — простой стек-навигатор
    theme.ts, format.ts
  components/        — Logo (знак-пин), Avatar, PostCard
  screens/           — AuthScreen, FeedScreen, ChatsScreen, ChatScreen
```

## Дальше (следующие итерации)
Профили, друзья/поиск, истории, картинки в постах/сообщениях, нативные пуши (FCM).
