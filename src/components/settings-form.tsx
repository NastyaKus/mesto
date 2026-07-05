"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImagePicker } from "@/components/ui/image-picker";

type Props = {
  displayName: string;
  status?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  isPrivate?: boolean;
};

const initialState: ActionState = {};

function Errors({ list }: { list?: string[] }) {
  return (
    <>
      {list?.map((e) => (
        <span key={e} className="mt-1 block text-xs text-red-500">
          {e}
        </span>
      ))}
    </>
  );
}

export function SettingsForm({
  displayName,
  status,
  bio,
  location,
  website,
  avatarUrl,
  coverUrl,
  isPrivate,
}: Props) {
  const [state, formAction] = useActionState(updateProfile, initialState);
  const saved = state.error === undefined && Object.keys(state).length > 0;

  return (
    <form action={formAction} className="card animate-fade-up p-5">
      <Field
        label="Имя"
        name="displayName"
        defaultValue={displayName}
        required
        errors={state.fieldErrors?.displayName}
      />
      <Field
        label="Статус"
        name="status"
        defaultValue={status ?? ""}
        placeholder="Например: в поиске вдохновения ✨"
        errors={state.fieldErrors?.status}
      />
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-medium text-muted">О себе</span>
        <textarea
          name="bio"
          defaultValue={bio ?? ""}
          rows={3}
          placeholder="Расскажите о себе"
          className="input resize-none"
        />
        <Errors list={state.fieldErrors?.bio} />
      </label>
      <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
        <Field
          label="Город"
          name="location"
          defaultValue={location ?? ""}
          placeholder="Москва"
          errors={state.fieldErrors?.location}
        />
        <Field
          label="Сайт / ссылка"
          name="website"
          defaultValue={website ?? ""}
          placeholder="https://…"
          errors={state.fieldErrors?.website}
        />
      </div>

      <div className="mb-3">
        <span className="mb-1 block text-sm font-medium text-muted">Аватар</span>
        <ImagePicker name="avatarUrl" defaultValue={avatarUrl} />
        <Errors list={state.fieldErrors?.avatarUrl} />
      </div>
      <div className="mb-3">
        <span className="mb-1 block text-sm font-medium text-muted">
          Обложка профиля
        </span>
        <ImagePicker name="coverUrl" defaultValue={coverUrl} />
        <Errors list={state.fieldErrors?.coverUrl} />
      </div>

      <label className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          name="isPrivate"
          defaultChecked={isPrivate}
          className="h-4 w-4 accent-[var(--brand)]"
        />
        <span className="text-sm">
          Закрытый профиль{" "}
          <span className="text-muted">
            — стену и друзей видят только друзья
          </span>
        </span>
      </label>

      {saved && <p className="mb-3 text-sm text-green-600">Сохранено ✓</p>}
      <SubmitButton>Сохранить</SubmitButton>
    </form>
  );
}
