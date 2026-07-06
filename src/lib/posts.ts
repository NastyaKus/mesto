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
  // Сохранил ли текущий пользователь пост в закладки.
  savedByMe: boolean;
  // Если это репост — превью оригинала.
  repostOf: {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    author: PublicAuthor;
    group: { slug: string; name: string; avatarUrl: string | null } | null;
  } | null;
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

// Как загружаем пост со связями (bookmarks фильтруем по зрителю).
function postArgs(viewerId: string) {
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
      // Закладка текущего пользователя (если есть).
      bookmarks: { where: { userId: viewerId }, select: { id: true } },
      // Оригинал репоста — для встроенного превью.
      repostOf: {
        select: {
          id: true,
          content: true,
          imageUrl: true,
          createdAt: true,
          author: { select: authorSelect },
          group: { select: groupSelect },
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
  };
}

type RawPost = {
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
  bookmarks: { id: string }[];
  repostOf: {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    author: PublicAuthor;
    group: { slug: string; name: string; avatarUrl: string | null } | null;
  } | null;
};

function shape(post: RawPost, viewerId: string): FeedPost {
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
    savedByMe: post.bookmarks.length > 0,
    repostOf: post.repostOf,
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
    ...postArgs(viewerId),
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
    ...postArgs(viewerId),
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
    ...postArgs(viewerId),
    take: 50,
  });
  return posts.map((p) => shape(p, viewerId));
}

/** Поиск постов по тексту (в т.ч. #хэштег) среди доступных зрителю записей. */
export async function searchPosts(
  query: string,
  viewerId: string,
): Promise<FeedPost[]> {
  const q = query.trim();
  if (!q) return [];
  const [friendIds, groupIds] = await Promise.all([
    getFriendIds(viewerId),
    getUserGroupIds(viewerId),
  ]);
  const posts = await prisma.post.findMany({
    where: {
      content: { contains: q, mode: "insensitive" },
      OR: [
        { authorId: { in: [viewerId, ...friendIds] }, groupId: null },
        { groupId: { in: groupIds } },
      ],
    },
    ...postArgs(viewerId),
    take: 50,
  });
  return posts.map((p) => shape(p, viewerId));
}

/** Один пост по id (для пермалинка и закреплённого поста профиля). */
export async function getPostById(
  id: string,
  viewerId: string,
): Promise<FeedPost | null> {
  const post = await prisma.post.findUnique({
    where: { id },
    include: postArgs(viewerId).include,
  });
  return post ? shape(post as RawPost, viewerId) : null;
}

/** Сохранённые пользователем посты (закладки). */
export async function getBookmarkedPosts(viewerId: string): Promise<FeedPost[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: viewerId },
    orderBy: { createdAt: "desc" },
    select: {
      post: { include: postArgs(viewerId).include },
    },
    take: 50,
  });
  return bookmarks.map((b) => shape(b.post as RawPost, viewerId));
}
