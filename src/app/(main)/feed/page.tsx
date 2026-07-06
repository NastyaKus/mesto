import { getCurrentUser } from "@/lib/session";
import { getFeedPosts } from "@/lib/posts";
import { getActiveStoriesFeed } from "@/lib/stories";
import { PostComposer } from "@/components/post-composer";
import { PostCard } from "@/components/post-card";
import { StoriesBar } from "@/components/stories-bar";

export default async function FeedPage() {
  const me = (await getCurrentUser())!;
  const [posts, storyGroups] = await Promise.all([
    getFeedPosts(me.id),
    getActiveStoriesFeed(me.id),
  ]);

  return (
    <div>
      <StoriesBar
        groups={storyGroups}
        me={{ displayName: me.displayName, avatarUrl: me.avatarUrl }}
      />
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
