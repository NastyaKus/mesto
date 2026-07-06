import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Нет соединения — mesto",
};

// Показывается service worker'ом, когда страница запрошена офлайн.
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">📡</p>
      <h1 className="mt-4 text-xl font-bold">Нет соединения</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        mesto не может связаться с сервером. Проверьте интернет — как только связь
        появится, обновите страницу.
      </p>
      <a href="/feed" className="btn-primary mt-6 px-5 py-2 text-sm">
        Попробовать снова
      </a>
    </div>
  );
}
