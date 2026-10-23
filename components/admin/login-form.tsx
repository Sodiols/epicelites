"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { signIn, signOut, type AuthState } from "@/app/(admin)/EEAUTHOR/actions";
import { FormError, TextField, Toggle, Field } from "./fields";

export function LoginForm({ signedInAs }: { signedInAs: string | null }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, null);
  const [show, setShow] = useState(false);
  const errors = state?.fieldErrors ?? {};

  if (signedInAs) {
    return (
      <div className="grid gap-4 text-sm">
        <p className="text-smoke">
          You are signed in as <span className="text-bone">{signedInAs}</span>, which is not an administrator account.
        </p>
        <form action={signOut}>
          <button type="submit" className="a-btn a-btn-secondary w-full">
            Sign out and use another account
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-5">
      <FormError message={state && !state.ok && !state.fieldErrors ? (state.message ?? null) : null} />
      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="username"
        inputMode="email"
        spellCheck={false}
        required
        error={errors.email}
        autoFocus
      />
      <Field label="Password" name="password" error={errors.password} required>
        {(p) => (
          <div className="relative">
            <input {...p} type={show ? "text" : "password"} autoComplete="current-password" required className="a-input pr-11" />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-smoke hover:text-bone"
            >
              {show ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
        )}
      </Field>
      <Toggle
        name="remember"
        label="Keep me signed in"
        help="On a shared computer, leave this off: the session ends when the browser closes."
      />
      <button type="submit" className="a-btn a-btn-primary mt-1 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign In"}
      </button>
      <Link href="/EEAUTHOR/forgot" className="justify-self-center text-sm text-smoke hover:text-bone">
        Forgot your password?
      </Link>
    </form>
  );
}
