import { ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pt-2">
      <ListSkeleton rows={5} variant="post" />
    </div>
  );
}
