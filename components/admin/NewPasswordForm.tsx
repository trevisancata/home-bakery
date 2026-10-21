"use client";

import { useActionState, useRef } from "react";
import { type FormState, nuevaContrasena } from "@/app/admin/actions";
import { Field, FormAlert, SubmitButton, useFocusFirstError } from "@/components/admin/AuthForm";
import { admin } from "@/data/admin";

const content = admin.newPassword;

export function NewPasswordForm() {
  const [state, action] = useActionState(nuevaContrasena, {} as FormState);
  const form = useRef<HTMLFormElement>(null);
  useFocusFirstError(state, form);

  return (
    <form ref={form} action={action} noValidate aria-labelledby="contrasena-titulo" className="flex flex-col gap-5">
      <h1 id="contrasena-titulo" className="text-36 lg:text-40">
        {content.title}
      </h1>
      <FormAlert state={state} />
      <Field
        label={content.password}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint={content.passwordHint}
        error={state.fields?.password}
      />
      <Field
        label={content.confirm}
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        error={state.fields?.confirm}
      />
      <SubmitButton pending={content.submitting}>{content.submit}</SubmitButton>
    </form>
  );
}
