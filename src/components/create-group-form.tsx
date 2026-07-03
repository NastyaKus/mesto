"use client";

import { useActionState } from "react";
import { createGroup, type GroupActionState } from "@/lib/actions/groups";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: GroupActionState = {};

export function CreateGroupForm() {
  const [state, formAction] = useActionState(createGroup, initial);

  return (
    <form action={formAction} className="card animate-fade-up mb-6 p-4">
      <h2 className="mb-3 font-semibold">Создать сообщество</h2>
      <Field label="Название" name="name" placeholder="Любители котиков" required />
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-medium text-muted">
          Описание
        </span>
        <textarea
          name="description"
          rows={2}
          placeholder="О чём это сообщество?"
          className="input resize-none"
        />
      </label>
      {state.error && <p className="mb-3 text-sm text-like">{state.error}</p>}
      <SubmitButton>Создать</SubmitButton>
    </form>
  );
}
