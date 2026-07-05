import { prisma } from "@/lib/prisma";
import { getUserGroupIds } from "@/lib/groups";

type PublicAuthor = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type FeedComment = {
  id: string;
  authorId: string;
  parentId: string | null;
  content: string;
  editedAt: Date | null;
  createdAt: Date;
  author: PublicAuthor;
};

// Форма поста для UI (с автором, реакциями и комментариями).
export type FeedPost = {
  id: string;
  content: string;
  imageUrl: string | null;
  editedAt: Date | null;
  createdAt: Date;
  isMine: boolean;
  // Реакции, сгруппированные по эмодзи, и моя реакция (если есть).
  reactions: { emoji: string; count: number }[];
  myReaction: string | null;
  author: PublicAuthor;
  // Если пост опубликован от лица сообщества — оно тут.
  group: {
    slug: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  comments: FeedComment[];
};

const authorSelect = {
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

const groupSelect = {
  slug: true,
  name: true,
  avatarUrl: true,
} as const;

// Как загружаем пост со связями.
function postArgs() {
  return {
    include: {
      author: { select: authorSelect },
      group: { select: groupSelect },
      comments: {
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: "asc" as const },
      },
      // Все реакции — группируем и считаем в shape().
      likes: { select: { emoji: true, userId: true } },
    },
    orderBy: { createdAt: "desc" as const },
  };
}

function shape(
  post: {
    id: string;
    content: string;
    imageUrl: string | null;
    editedAt: Date | null;
    createdAt: Date;
    authorId: string;
    author: PublicAuthor;
    group: { slug: string; name: string; avatarUrl: string | null } | null;
    comments: FeedComment[];
    likes: { emoji: string; userId: string }[];
  },
  viewerId: string,
): FeedPost {
  // Группируем реакции по эмодзи.
  const counts = new Map<string, number>();
  for (const l of post.likes) counts.set(l.emoji, (counts.get(l.emoji) ?? 0) + 1);
  const reactions = [...counts.entries()]
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count);
  const myReaction = post.likes.find((l) => l.userId === viewerId)?.emoji ?? null;

  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    editedAt: post.editedAt,
    createdAt: post.createdAt,
    isMine: post.authorId === viewerId,
    reactions,
    myReaction,
    author: post.author,
    group: post.group,
    comments: post.comments,
  };
}

/** ID подтверждённых друзей пользователя. */
async function getFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId,
  );
}

/** Лента: личные посты друзей и свои + посты сообществ, где я состою. */
export async function getFeedPosts(viewerId: string): Promise<FeedPost[]> {
  const [friendIds, groupIds] = await Promise.all([
    getFriendIds(viewerId),
    getUserGroupIds(viewerId),
  ]);
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        // Личные записи друзей и мои (не групповые)
        { authorId: { in: [viewerId, ...friendIds] }, groupId: null },
        // Записи сообществ, в которых я состою
        { groupId: { in: groupIds } },
      ],
    },
    ...postArgs(),
    take: 50,
  });
  return posts.map((p) => shape(p, viewerId));
}

/** Личная стена пользователя (только его личные записи, без сообществ). */
export async function getUserPosts(
  authorId: string,
  viewerId: string,
): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: { authorId, groupId: null },
    ...postArgs(),
    take: 50,
  });
  return posts.map((p) => shape(p, viewerId));
}

/** Стена сообщества. */
export async function getGroupPosts(
  groupId: string,
  viewerId: string,
): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: { groupId },
    ...postArgs(),
    take: 50,
  });
  return posts.map((p) => shape(p, viewerId));
}
