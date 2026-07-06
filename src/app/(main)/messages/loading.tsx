import { ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="shimmer mb-4 h-6 w-40 rounded-lg" />
      <ListSkeleton rows={6} variant="row" />
    </div>
  );
}
