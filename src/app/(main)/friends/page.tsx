import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  getFriends,
  getIncomingRequests,
  getFriendState,
  publicUserSelect,
  type FriendState,
} from "@/lib/friends";
import { UserCard } from "@/components/user-card";

type SearchParams = { q?: string };

// Ищем людей по displayName или username (без учёта регистра), кроме себя.
async function searchUsers(query: string, excludeId: string) {
  return prisma.user.findMany({
    where: {
      id: { not: excludeId },
      OR: [
        { displayName: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
      ],
    },
    select: publicUserSelect,
    take: 30,
  });
}

async function withStates<T extends { id: string }>(
  users: T[],
  viewerId: string,
): Promise<{ user: T; state: FriendState }[]> {
  return Promise.all(
    users.map(async (user) => ({
      user,
      state: await getFriendState(viewerId, user.id),
    })),
  );
}

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const me = (await getCurrentUser())!;
  const { q } = await searchParams;
  const query = q?.trim();

  // Режим поиска.
  if (query) {
    const results = await searchUsers(query, me.id);
    const rows = await withStates(results, me.id);
    return (
      <section>
        <h1 className="mb-4 text-lg font-semibold">
          Результаты поиска: «{query}»
        </h1>
        {rows.length === 0 ? (
          <p className="text-muted">Никого не нашли.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map(({ user, state }) => (
              <UserCard key={user.id} user={user} state={state} />
            ))}
          </div>
        )}
      </section>
    );
  }

  // Обычный режим: входящие заявки + список друзей.
  const [incoming, friends] = await Promise.all([
    getIncomingRequests(me.id),
    getFriends(me.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {incoming.length > 0 && (
        <section>
          <h1 className="mb-3 text-lg font-semibold">
            Заявки в друзья ({incoming.length})
          </h1>
          <div className="flex flex-col gap-2">
            {incoming.map((user) => (
              <UserCard key={user.id} user={user} state="INCOMING" />
            ))}
          </div>
        </section>
      )}

      <section>
        <h1 className="mb-3 text-lg font-semibold">
          Мои друзья ({friends.length})
        </h1>
        {friends.length === 0 ? (
          <p className="text-muted">
            Пока нет друзей. Найдите знакомых через поиск сверху.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((user) => (
              <UserCard key={user.id} user={user} state="FRIENDS" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
