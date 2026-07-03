"use client";

import { useFormStatus } from "react-dom";

// Кнопка отправки формы, блокируется во время выполнения server action.
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-2.5"
    >
      {pending && <span className="spinner" />}
      {pending ? "Подождите…" : children}
    </button>
  );
}
