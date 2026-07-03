import Link from "next/link";
import { getGroups } from "@/lib/groups";
import { Avatar } from "@/components/ui/avatar";
import { CreateGroupForm } from "@/components/create-group-form";

export default async function GroupsPage() {
  const groups = await getGroups();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Сообщества</h1>
      <CreateGroupForm />

      {groups.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-3xl">🌐</p>
          <p className="mt-2 font-medium">Пока нет сообществ</p>
          <p className="mt-1 text-sm text-muted">
            Создайте первое сообщество формой выше.
          </p>
        </div>
      ) : (
        <div className="stagger flex flex-col gap-2">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.slug}`}
              className="card flex items-center gap-3 p-3 transition-transform hover:-translate-y-0.5"
            >
              <Avatar src={g.avatarUrl} name={g.name} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{g.name}</div>
                <div className="truncate text-xs text-muted">
                  {g.memberCount}{" "}
                  {g.memberCount === 1 ? "участник" : "участников"}
                  {g.description ? ` · ${g.description}` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
