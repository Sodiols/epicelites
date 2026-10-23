"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/auth/admin";
import { useToast } from "./toast";

type RunProps = {
  /** Server Action bound to its record, e.g. deletePlayer.bind(null, id). */
  action: () => Promise<ActionResult<unknown>>;
  children: React.ReactNode;
  className?: string;
  success?: string;
  /** Path to navigate to after success (e.g. back to the list after a delete). */
  redirectTo?: string;
  /** When set, a confirmation dialog must be accepted first. */
  confirm?: { title: string; body: React.ReactNode; confirmLabel: string; danger?: boolean };
  disabled?: boolean;
  "aria-label"?: string;
};

/**
 * Button that runs one Server Action (publish, archive, delete, mark read...). Destructive
 * actions go through a modal confirmation built on <dialog>, which traps focus, closes on
 * Escape and returns focus to the button.
 */
export function ActionButton({ action, children, className, success, redirectTo, confirm, disabled, ...aria }: RunProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const run = () => {
    startTransition(async () => {
      let result: ActionResult<unknown>;
      try {
        result = await action();
      } catch {
        result = { ok: false, message: "The request failed. Check your connection and try again." };
      }
      setOpen(false);
      if (result.ok) {
        toast("success", result.message ?? success ?? "Done");
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else {
        toast("error", result.message);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className={className ?? "a-btn a-btn-secondary"}
        disabled={disabled || pending}
        aria-busy={pending}
        onClick={() => (confirm ? setOpen(true) : run())}
        {...aria}
      >
        {children}
      </button>
      {confirm && (
        <dialog
          ref={dialogRef}
          onClose={() => setOpen(false)}
          aria-labelledby="confirm-title"
          className="m-auto w-[min(28rem,calc(100vw-2rem))] border border-line bg-carbon p-0 text-bone backdrop:bg-night/80 backdrop:backdrop-blur-sm"
        >
          <div className="p-6">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {confirm.title}
            </h2>
            <div className="mt-2 text-sm text-smoke">{confirm.body}</div>
          </div>
          <div className="flex justify-end gap-2 border-t border-line bg-night/40 px-6 py-4">
            <button type="button" className="a-btn a-btn-ghost" onClick={() => setOpen(false)} autoFocus>
              Cancel
            </button>
            <button
              type="button"
              className={`a-btn ${confirm.danger ? "a-btn-danger" : "a-btn-primary"}`}
              onClick={run}
              disabled={pending}
            >
              {pending ? "Working…" : confirm.confirmLabel}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
