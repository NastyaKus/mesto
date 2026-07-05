import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Lightbox } from "@/components/ui/lightbox";
import { PostInteractions } from "@/components/post-interactions";
import { DeletePostButton } from "@/components/delete-post-button";
import { timeAgo } from "@/lib/format";
import type { FeedPost } from "@/lib/posts";

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <article className="card p-4">
      <header className="flex items-center gap-3">
        {post.group ? (
          <>
            <Link href={`/groups/${post.group.slug}`}>
              <Avatar
                src={post.group.avatarUrl}
                name={post.group.name}
                size={44}
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/groups/${post.group.slug}`}
                className="font-semibold hover:text-brand"
              >
                {post.group.name}
              </Link>
              <div className="text-xs text-muted">
                {timeAgo(post.createdAt)}
              </div>
            </div>
          </>
        ) : (
          <>
            <Link href={`/profile/${post.author.username}`}>
              <Avatar
                src={post.author.avatarUrl}
                name={post.author.displayName}
                size={44}
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${post.author.username}`}
                className="font-semibold hover:text-brand"
              >
                {post.author.displayName}
              </Link>
              <div className="text-xs text-muted">
                {timeAgo(post.createdAt)}
              </div>
            </div>
          </>
        )}
        {post.isMine && <DeletePostButton postId={post.id} />}
      </header>

      <p className="mt-3 whitespace-pre-wrap break-words">{post.content}</p>

      {post.imageUrl && (
        <Lightbox
          src={post.imageUrl}
          className="mt-3 max-h-[500px] w-full rounded-xl object-cover"
        />
      )}

      <PostInteractions
        postId={post.id}
        likedByMe={post.likedByMe}
        likeCount={post.likeCount}
        comments={post.comments}
      />
    </article>
  );
}
