import { getCurrentUser } from "@/lib/session";
import { getFeedPosts } from "@/lib/posts";
import { PostComposer } from "@/components/post-composer";
import { PostCard } from "@/components/post-card";

export default async function FeedPage() {
  const me = (await getCurrentUser())!;
  const posts = await getFeedPosts(me.id);

  return (
    <div>
      <PostComposer user={me} />

      {posts.length === 0 ? (
        <div className="card animate-fade-up p-8 text-center">
          <p className="text-3xl">📭</p>
          <p className="mt-2 font-medium">Пока пусто</p>
          <p className="mt-1 text-sm text-muted">
            Напишите первый пост или найдите друзей — их записи появятся здесь.
          </p>
        </div>
      ) : (
        <div className="stagger flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} meId={me.id} />
          ))}
        </div>
      )}
    </div>
  );
}
