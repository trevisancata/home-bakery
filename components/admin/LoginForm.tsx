"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { type FormState, ingresar } from "@/app/admin/actions";
import { Field, FormAlert, SubmitButton, useFocusFirstError } from "@/components/admin/AuthForm";
import { admin } from "@/data/admin";

const content = admin.login;

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(ingresar, {} as FormState);
  const form = useRef<HTMLFormElement>(null);
  useFocusFirstError(state, form);

  return (
    <form ref={form} action={action} noValidate aria-labelledby="login-titulo" className="flex flex-col gap-5">
      <h1 id="login-titulo" className="text-40 lg:text-44">
        {content.title}
      </h1>
      <FormAlert state={state} />
      <input type="hidden" name="next" value={next} />
      <Field
        label={content.email}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        required
        defaultValue={state.email}
        error={state.fields?.email}
      />
      <Field
        label={content.password}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fields?.password}
      />
      <SubmitButton pending={content.submitting}>{content.submit}</SubmitButton>
      <Link href={content.forgot.href} className="self-center px-3 py-2.5 text-14 font-semibold text-chocolate hover:text-carbon">
        {content.forgot.label}
      </Link>
    </form>
  );
}
