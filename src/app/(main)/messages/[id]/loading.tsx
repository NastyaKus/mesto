export default function Loading() {
  return (
    <div className="card flex h-[calc(100dvh-12rem)] flex-col overflow-hidden md:h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 border-b border-border p-3">
        <div className="shimmer h-10 w-10 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <div className="shimmer h-3.5 w-32 rounded" />
          <div className="shimmer h-3 w-20 rounded" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="shimmer h-9 w-40 self-start rounded-2xl" />
        <div className="shimmer h-9 w-52 self-end rounded-2xl" />
        <div className="shimmer h-9 w-32 self-start rounded-2xl" />
        <div className="shimmer h-16 w-56 self-end rounded-2xl" />
      </div>
    </div>
  );
}
