import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getPostById } from "@/lib/posts";
import { PostCard } from "@/components/post-card";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = (await getCurrentUser())!;
  const post = await getPostById(id, me.id);
  if (!post) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/feed" className="btn-ghost px-3 py-1.5 text-sm">
          ← Лента
        </Link>
        <h1 className="text-lg font-semibold">Запись</h1>
      </div>
      <PostCard post={post} meId={me.id} />
    </div>
  );
}
