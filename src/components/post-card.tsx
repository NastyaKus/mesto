import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Lightbox } from "@/components/ui/lightbox";
import { PostContent } from "@/components/post-content";
import { PostInteractions } from "@/components/post-interactions";
import { DeletePostButton } from "@/components/delete-post-button";
import { PinPostButton } from "@/components/pin-post-button";
import { renderRichText } from "@/lib/rich-text";
import { timeAgo } from "@/lib/format";
import type { FeedPost } from "@/lib/posts";

export function PostCard({
  post,
  meId,
  showPin = false,
  pinned = false,
}: {
  post: FeedPost;
  meId: string;
  showPin?: boolean;
  pinned?: boolean;
}) {
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
        {showPin && post.isMine && (
          <PinPostButton postId={post.id} pinned={pinned} />
        )}
        {post.isMine && <DeletePostButton postId={post.id} />}
      </header>

      <PostContent
        postId={post.id}
        content={post.content}
        editedAt={post.editedAt}
        isMine={post.isMine}
      />

      {post.imageUrl && (
        <Lightbox
          src={post.imageUrl}
          className="mt-3 max-h-[500px] w-full rounded-xl object-cover"
        />
      )}

      {/* Встроенный оригинал репоста */}
      {post.repostOf && (
        <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3">
          <div className="mb-1 flex items-center gap-2 text-sm">
            <span className="text-muted">🔁</span>
            <Link
              href={`/profile/${post.repostOf.author.username}`}
              className="font-medium hover:text-brand"
            >
              {post.repostOf.author.displayName}
            </Link>
            <span className="text-xs text-muted">
              {timeAgo(post.repostOf.createdAt)}
            </span>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm">
            {renderRichText(post.repostOf.content)}
          </p>
          {post.repostOf.imageUrl && (
            <Lightbox
              src={post.repostOf.imageUrl}
              className="mt-2 max-h-80 w-full rounded-lg object-cover"
            />
          )}
        </div>
      )}

      <PostInteractions
        postId={post.id}
        reactions={post.reactions}
        myReaction={post.myReaction}
        comments={post.comments}
        savedByMe={post.savedByMe}
        meId={meId}
      />
    </article>
  );
}
