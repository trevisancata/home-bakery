"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { type FormState, recuperar } from "@/app/admin/actions";
import { Field, FormAlert, SubmitButton, useFocusFirstError } from "@/components/admin/AuthForm";
import { admin } from "@/data/admin";

const content = admin.recover;

export function RecoverForm({ invalidLink }: { invalidLink: boolean }) {
  const initial: FormState = invalidLink ? { error: content.invalidLink } : {};
  const [state, action] = useActionState(recuperar, initial);
  const form = useRef<HTMLFormElement>(null);
  useFocusFirstError(state, form);

  return (
    <form ref={form} action={action} noValidate aria-labelledby="recuperar-titulo" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 id="recuperar-titulo" className="text-36 lg:text-40">
          {content.title}
        </h1>
        <p className="leading-parrafo text-secundario">{content.text}</p>
      </div>
      <FormAlert state={state} />
      <Field
        label={admin.login.email}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        required
        defaultValue={state.email}
        error={state.fields?.email}
      />
      <SubmitButton pending={content.submitting}>{content.submit}</SubmitButton>
      <Link href={content.back.href} className="self-center px-3 py-2.5 text-14 font-semibold text-chocolate hover:text-carbon">
        {content.back.label}
      </Link>
    </form>
  );
}
