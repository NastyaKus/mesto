import { ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="card overflow-hidden p-0">
        <div className="shimmer h-40 w-full" />
        <div className="px-5 pb-5">
          <div className="-mt-12 flex items-end gap-4">
            <div className="shimmer h-24 w-24 rounded-full ring-4 ring-surface" />
            <div className="mb-2 flex flex-col gap-2">
              <div className="shimmer h-5 w-40 rounded-lg" />
              <div className="shimmer h-3.5 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      <ListSkeleton rows={3} variant="post" />
    </div>
  );
}
