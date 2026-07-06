import { prisma } from "@/lib/prisma";
import { getFriends } from "@/lib/friends";

const DAY_MS = 24 * 60 * 60 * 1000;

// Одна история в ленте кружков.
export type StoryItem = {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  viewed: boolean;
  viewsCount: number; // осмысленно только для своих историй
};

// Группа историй одного автора.
export type StoryGroup = {
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  isMine: boolean;
  hasUnseen: boolean;
  stories: StoryItem[];
};

/** Создаёт историю на 24 часа. */
export function createStory(authorId: string, imageUrl: string, caption?: string) {
  return prisma.story.create({
    data: {
      authorId,
      imageUrl,
      caption: caption?.trim() || null,
      expiresAt: new Date(Date.now() + DAY_MS),
    },
  });
}

/** Активные истории меня и друзей, сгруппированные по автору. */
export async function getActiveStoriesFeed(
  viewerId: string,
): Promise<StoryGroup[]> {
  const friends = await getFriends(viewerId);
  const authorIds = [viewerId, ...friends.map((f) => f.id)];

  const stories = await prisma.story.findMany({
    where: { authorId: { in: authorIds }, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      views: { where: { viewerId }, select: { id: true } },
      _count: { select: { views: true } },
    },
  });

  // Группируем по автору с сохранением порядка появления.
  const groups = new Map<string, StoryGroup>();
  for (const s of stories) {
    let g = groups.get(s.authorId);
    if (!g) {
      g = {
        author: s.author,
        isMine: s.authorId === viewerId,
        hasUnseen: false,
        stories: [],
      };
      groups.set(s.authorId, g);
    }
    const viewed = s.views.length > 0;
    if (!viewed && !g.isMine) g.hasUnseen = true;
    g.stories.push({
      id: s.id,
      imageUrl: s.imageUrl,
      caption: s.caption,
      createdAt: s.createdAt.toISOString(),
      viewed,
      viewsCount: g.isMine ? s._count.views : 0,
    });
  }

  // Порядок: сначала мои, затем группы с непросмотренным, затем остальные.
  return [...groups.values()].sort((a, b) => {
    if (a.isMine !== b.isMine) return a.isMine ? -1 : 1;
    if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
    return 0;
  });
}

/** Отмечает историю просмотренной (если зритель — автор или его друг). */
export async function markStoryViewed(storyId: string, viewerId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { authorId: true, expiresAt: true },
  });
  if (!story || story.expiresAt <= new Date()) return;

  if (story.authorId !== viewerId) {
    // Только друзья автора могут смотреть (и отмечать просмотр).
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: viewerId, addresseeId: story.authorId },
          { requesterId: story.authorId, addresseeId: viewerId },
        ],
      },
      select: { id: true },
    });
    if (!friendship) return;
  }

  await prisma.storyView.upsert({
    where: { storyId_viewerId: { storyId, viewerId } },
    update: {},
    create: { storyId, viewerId },
  });
}

/** Список просмотревших историю — только для её автора. */
export async function getStoryViewers(storyId: string, requesterId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { authorId: true },
  });
  if (!story || story.authorId !== requesterId) return [];

  const views = await prisma.storyView.findMany({
    where: { storyId },
    orderBy: { createdAt: "desc" },
    include: {
      viewer: {
        select: { username: true, displayName: true, avatarUrl: true },
      },
    },
  });
  return views.map((v) => v.viewer);
}

/** Удаляет свою историю. */
export async function deleteStoryById(storyId: string, requesterId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { authorId: true },
  });
  if (!story || story.authorId !== requesterId) return;
  await prisma.story.delete({ where: { id: storyId } });
}
