"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImagePicker } from "@/components/ui/image-picker";

type Props = {
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

const initialState: ActionState = {};

export function SettingsForm({ displayName, bio, avatarUrl }: Props) {
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
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-medium text-muted">
          О себе
        </span>
        <textarea
          name="bio"
          defaultValue={bio ?? ""}
          rows={3}
          placeholder="Расскажите о себе"
          className="input resize-none"
        />
        {state.fieldErrors?.bio?.map((e) => (
          <span key={e} className="mt-1 block text-xs text-red-500">
            {e}
          </span>
        ))}
      </label>
      <div className="mb-3">
        <span className="mb-1 block text-sm font-medium text-muted">Аватар</span>
        <ImagePicker name="avatarUrl" defaultValue={avatarUrl} />
        {state.fieldErrors?.avatarUrl?.map((e) => (
          <span key={e} className="mt-1 block text-xs text-red-500">
            {e}
          </span>
        ))}
      </div>
      {saved && (
        <p className="mb-3 text-sm text-green-600">Сохранено ✓</p>
      )}
      <SubmitButton>Сохранить</SubmitButton>
    </form>
  );
}
