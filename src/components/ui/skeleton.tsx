// Скелетоны загрузки на классе .shimmer (см. globals.css).

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}

// Заглушка карточки поста.
export function PostSkeleton() {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
    </div>
  );
}

// Заглушка строки списка (диалог, человек).
export function RowSkeleton() {
  return (
    <div className="card flex items-center gap-3 p-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function ListSkeleton({
  rows = 6,
  variant = "post",
}: {
  rows?: number;
  variant?: "post" | "row";
}) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) =>
        variant === "post" ? <PostSkeleton key={i} /> : <RowSkeleton key={i} />,
      )}
    </div>
  );
}
