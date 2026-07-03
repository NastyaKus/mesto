import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="brand-gradient text-6xl font-extrabold">404</div>
      <p className="mt-3 text-lg font-medium">Страница не найдена</p>
      <p className="mt-1 text-sm text-muted">
        Возможно, ссылка устарела или страница была удалена.
      </p>
      <Link href="/feed" className="btn-primary mt-6 px-5 py-2">
        На главную
      </Link>
    </div>
  );
}
