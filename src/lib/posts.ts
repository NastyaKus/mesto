import { prisma } from "@/lib/prisma";
import { getUserGroupIds } from "@/lib/groups";

// Форма поста для UI (с автором, счётчиками и флагом «лайкнул ли я»).
export type FeedPost = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  isMine: boolean;
  likedByMe: boolean;
  likeCount: number;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  // Если пост опубликован от лица сообщества — оно тут.
  group: {
    slug: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    author: {
      username: string;
      displayName: string;
      avatarUrl: string | null;
    };
  }[];
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

// Как загружаем пост со связями. viewerId нужен, чтобы понять «мой ли лайк».
function postArgs(viewerId: string) {
  return {
    include: {
      author: { select: authorSelect },
      group: { select: groupSelect },
      comments: {
        include: { author: { select: authorSelect } },
        orderBy: { createdAt: "asc" as const },
      },
      likes: { where: { userId: viewerId }, select: { id: true } },
      _count: { select: { likes: true } },
    },
    orderBy: { createdAt: "desc" as const },
  };
}

function shape(
  post: {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    authorId: string;
    author: { username: string; displayName: string; avatarUrl: string | null };
    group: { slug: string; name: string; avatarUrl: string | null } | null;
    comments: FeedPost["comments"];
    likes: { id: string }[];
    _count: { likes: number };
  },
  viewerId: string,
): FeedPost {
  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    isMine: post.authorId === viewerId,
    likedByMe: post.likes.length > 0,
    likeCount: post._count.likes,
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
