"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/auth/admin";
import { useToast } from "./toast";

type Options<T> = {
  /** Message for the success toast; the action's own message wins if it returns one. */
  success?: string;
  /** Where to go after success (e.g. the new record's edit page). */
  redirectTo?: (result: { data?: T }) => string | null | undefined;
  /** Reset the form after success. */
  reset?: boolean;
};

/**
 * Wraps a Server Action for an admin form: pending state, inline field errors, toast
 * feedback, focus on the first invalid field, and an unsaved-changes guard that warns
 * before leaving a dirty form.
 */
export function useActionForm<T = unknown>(
  action: (form: FormData) => Promise<ActionResult<T>>,
  options: Options<T> = {},
) {
  const toast = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const submit = useCallback(
    (form: FormData) => {
      setFormError(null);
      startTransition(async () => {
        let result: ActionResult<T>;
        try {
          result = await action(form);
        } catch {
          result = { ok: false, message: "The request failed. Check your connection and try again." };
        }
        if (result.ok) {
          setErrors({});
          setDirty(false);
          toast("success", result.message ?? options.success ?? "Saved");
          if (options.reset) formRef.current?.reset();
          const to = options.redirectTo?.(result);
          if (to) router.push(to);
          else router.refresh();
        } else {
          setErrors(result.fieldErrors ?? {});
          setFormError(result.message);
          toast("error", result.message);
          const first = Object.keys(result.fieldErrors ?? {})[0];
          if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        }
      });
    },
    [action, options, router, toast],
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    submit(fd);
  };

  return {
    formRef,
    pending,
    errors,
    formError,
    dirty,
    submit,
    formProps: {
      ref: formRef,
      onSubmit,
      onChange: () => setDirty(true),
      noValidate: true,
    },
  };
}
