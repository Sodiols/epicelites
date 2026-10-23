"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, updatePassword, type AuthState } from "@/app/(admin)/EEAUTHOR/actions";
import { FormError, TextField } from "./fields";
import { Notice } from "./auth-card";

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, null);
  if (state?.ok) {
    return (
      <div className="grid gap-4">
        <Notice tone="info">{state.message}</Notice>
        <Link href="/EEAUTHOR" className="a-btn a-btn-secondary w-full">
          Back to sign in
        </Link>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="grid gap-5">
      <p className="text-sm text-smoke">Enter your admin email. If it matches an account, Supabase sends a reset link.</p>
      <FormError message={state && !state.ok && !state.fieldErrors ? (state.message ?? null) : null} />
      <TextField label="Email address" name="email" type="email" autoComplete="username" required error={state?.fieldErrors?.email} autoFocus />
      <button type="submit" className="a-btn a-btn-primary w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <Link href="/EEAUTHOR" className="justify-self-center text-sm text-smoke hover:text-bone">
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, null);
  const errors = state?.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="grid gap-5">
      <FormError message={state && !state.ok && !state.fieldErrors ? (state.message ?? null) : null} />
      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={12}
        required
        help="At least 12 characters. A long phrase is stronger than a short complex word."
        error={errors.password}
        autoFocus
      />
      <TextField label="Repeat new password" name="confirm" type="password" autoComplete="new-password" required error={errors.confirm} />
      <button type="submit" className="a-btn a-btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
