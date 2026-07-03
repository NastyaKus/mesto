"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser, type ActionState } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: ActionState = {};

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerUser, initialState);

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Регистрация</h2>
      <form action={formAction}>
        <Field
          label="Имя"
          name="displayName"
          placeholder="Иван Иванов"
          required
          errors={state.fieldErrors?.displayName}
        />
        <Field
          label="Логин"
          name="username"
          placeholder="ivan_ivanov"
          required
          errors={state.fieldErrors?.username}
        />
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
          placeholder="Минимум 6 символов"
          required
          errors={state.fieldErrors?.password}
        />
        {state.error && (
          <p className="mb-3 text-sm text-red-500">{state.error}</p>
        )}
        <SubmitButton>Зарегистрироваться</SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
