import { getCurrentUser } from "@/lib/session";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const me = (await getCurrentUser())!;

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Редактировать профиль</h1>
      <SettingsForm
        displayName={me.displayName}
        bio={me.bio}
        avatarUrl={me.avatarUrl}
      />
    </div>
  );
}
