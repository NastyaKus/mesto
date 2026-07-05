import { getCurrentUser } from "@/lib/session";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const me = (await getCurrentUser())!;

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Редактировать профиль</h1>
      <SettingsForm
        displayName={me.displayName}
        status={me.status}
        bio={me.bio}
        location={me.location}
        website={me.website}
        avatarUrl={me.avatarUrl}
        coverUrl={me.coverUrl}
        isPrivate={me.isPrivate}
      />
    </div>
  );
}
