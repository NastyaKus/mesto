import { LogoMark } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Мягкие цветные пятна на фоне */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-brand-2/25 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />

      <div className="animate-fade-up mb-7 flex flex-col items-center text-center">
        <div className="animate-bob drop-shadow-[0_10px_30px_rgba(108,92,231,0.45)]">
          <LogoMark size={76} />
        </div>
        <h1 className="brand-gradient mt-3 text-5xl font-extrabold tracking-tight">
          mesto
        </h1>
        <p className="mt-2 text-sm text-muted">место, где вы на связи</p>
      </div>
      <div className="card animate-scale-in w-full max-w-sm p-6">{children}</div>
    </div>
  );
}
