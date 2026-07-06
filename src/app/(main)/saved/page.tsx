import { getCurrentUser } from "@/lib/session";
import { getBookmarkedPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";

export default async function SavedPage() {
  const me = (await getCurrentUser())!;
  const posts = await getBookmarkedPosts(me.id);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">🔖 Сохранённое</h1>
      {posts.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-3xl">🔖</p>
          <p className="mt-2 font-medium">Пока пусто</p>
          <p className="mt-1 text-sm text-muted">
            Нажмите «Сохранить» под записью — она появится здесь.
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
