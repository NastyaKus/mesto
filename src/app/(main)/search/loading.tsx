import { ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="shimmer mb-4 h-6 w-48 rounded-lg" />
      <div className="mb-4 flex gap-2">
        <div className="shimmer h-8 w-24 rounded-full" />
        <div className="shimmer h-8 w-24 rounded-full" />
        <div className="shimmer h-8 w-28 rounded-full" />
      </div>
      <ListSkeleton rows={5} variant="row" />
    </div>
  );
}
