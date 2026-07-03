"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser, type ActionState } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: ActionState = {};

export default function LoginPage() {
  const [state, formAction] = useActionState(loginUser, initialState);

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Вход</h2>
      <form action={formAction}>
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="ivan@example.com"
          required
          errors={state.fieldErrors?.email}
        />
        <Field
          label="Пароль"
          name="password"
          type="password"
          placeholder="Ваш пароль"
          required
          errors={state.fieldErrors?.password}
        />
        {state.error && (
          <p className="mb-3 text-sm text-red-500">{state.error}</p>
        )}
        <SubmitButton>Войти</SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Нет аккаунта?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
