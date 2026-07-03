export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Мягкие цветные пятна на фоне */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-brand-2/20 blur-3xl" />

      <div className="animate-fade-up mb-7 text-center">
        <h1 className="brand-gradient text-5xl font-extrabold tracking-tight">
          mesto
        </h1>
        <p className="mt-2 text-sm text-muted">место, где вы на связи</p>
      </div>
      <div className="card animate-fade-up w-full max-w-sm p-6">{children}</div>
    </div>
  );
}
