"use client";

import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRightIcon, CheckIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { easeOutExpo, snappy } from "@/lib/motion";
import { submitContact } from "@/app/(public)/contact/actions";
import { CONTACT_TURNSTILE_ACTION } from "@/lib/turnstile";
import { Turnstile, type TurnstileHandle } from "./turnstile";

type Field = "name" | "email" | "topic" | "message";
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "sending" | "sent" | "failed";

const TOPICS = [
  { value: "partnership", label: "Partnership" },
  { value: "tournament", label: "Tournament invitation" },
  { value: "media", label: "Media request" },
  { value: "general", label: "General message" },
];

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function validate(data: Record<Field, string>): Errors {
  const errors: Errors = {};
  if (!data.name.trim()) errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = "Enter an email address like you@example.com.";
  if (!data.topic) errors.topic = "Choose what your message is about.";
  if (data.message.trim().length < 10) errors.message = "Write at least 10 characters so the team knows what you need.";
  return errors;
}

/**
 * Sends the inquiry to the team inbox (Supabase). Success is only shown after the database
 * confirms the message was stored; any failure says so plainly and keeps what was typed.
 */
export function ContactForm({ email }: { email: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const turnstile = useRef<TurnstileHandle>(null);
  const [verified, setVerified] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      topic: String(fd.get("topic") ?? ""),
      message: String(fd.get("message") ?? ""),
    };
    const found = validate(data);
    setErrors(found);
    const first = (Object.keys(found) as Field[])[0];
    if (first) {
      setStatus("idle");
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (turnstileSiteKey && !verified) {
      setStatus("failed");
      setNotice("Complete the verification check above the button, then send again.");
      return;
    }

    setStatus("sending");
    setNotice("");
    startTransition(async () => {
      const result = await submitContact(fd).catch(() => ({
        ok: false as const,
        message: "Your message could not be sent. Check your connection and try again.",
      }));
      if (result.ok) {
        setStatus("sent");
        setNotice("Message received. The team replies to the email address you gave.");
        form.reset();
      } else {
        setStatus("failed");
        setNotice(result.message);
        if ("fieldErrors" in result && result.fieldErrors) setErrors(result.fieldErrors as Errors);
      }
      // Each token works once, so get a fresh one before any further submission.
      turnstile.current?.reset();
    });
  };

  const clear = (f: Field) => {
    if (errors[f]) setErrors((e) => ({ ...e, [f]: undefined }));
    if (status === "sent") setStatus("idle");
  };

  const fieldProps = (f: Field) => ({
    id: `contact-${f}`,
    name: f,
    "aria-invalid": errors[f] ? true : undefined,
    "aria-describedby": errors[f] ? `contact-${f}-error` : undefined,
    onChange: () => clear(f),
  });

  const ErrorText = ({ f }: { f: Field }) => (
    <AnimatePresence initial={false}>
      {errors[f] && (
        <motion.p
          id={`contact-${f}-error`}
          className="flex items-center gap-1.5 overflow-hidden text-sm text-[#ff9aa6]"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: easeOutExpo }}
        >
          <WarningCircleIcon size={16} aria-hidden className="shrink-0" />
          {errors[f]}
        </motion.p>
      )}
    </AnimatePresence>
  );

  const label = "text-sm font-semibold text-bone";
  const busy = pending || status === "sending";

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="frame grid gap-6 p-6 [--cut:28px] sm:p-10">
      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="contact-name" className={label}>Your name</label>
          <input {...fieldProps("name")} type="text" autoComplete="name" maxLength={100} placeholder="Full name…" className="field" />
          <ErrorText f="name" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="contact-email" className={label}>Email</label>
          <input
            {...fieldProps("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            maxLength={200}
            placeholder="you@example.com"
            className="field"
          />
          <ErrorText f="email" />
        </div>
      </div>

      <fieldset className="grid gap-3">
        <legend className={`${label} mb-2`}>What is it about?</legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <label key={t.value} className="group relative cursor-pointer">
              <input
                type="radio"
                name="topic"
                value={t.value}
                onChange={() => clear("topic")}
                aria-describedby={errors.topic ? "contact-topic-error" : undefined}
                className="peer sr-only"
              />
              <span className="block border border-line px-4 py-2.5 text-sm transition-colors group-hover:border-smoke peer-checked:border-violet peer-checked:bg-violet peer-checked:text-night peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet">
                {t.label}
              </span>
            </label>
          ))}
        </div>
        <ErrorText f="topic" />
      </fieldset>

      <div className="grid gap-2">
        <label htmlFor="contact-message" className={label}>Message</label>
        <textarea
          {...fieldProps("message")}
          rows={6}
          maxLength={5000}
          placeholder="Tell the team what you have in mind…"
          className="field resize-y"
        />
        <ErrorText f="message" />
      </div>

      {turnstileSiteKey && (
        <Turnstile ref={turnstile} siteKey={turnstileSiteKey} action={CONTACT_TURNSTILE_ACTION} onToken={(t) => setVerified(Boolean(t))} />
      )}

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" disabled={busy} className="btn btn-primary group min-w-52 disabled:cursor-wait">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={busy ? "busy" : status === "sent" ? "sent" : "idle"}
              className="inline-flex items-center gap-2"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={snappy}
            >
              {busy ? (
                "Sending…"
              ) : status === "sent" ? (
                <>
                  <CheckIcon size={16} weight="bold" aria-hidden />
                  Message sent
                </>
              ) : (
                <>
                  Send message
                  <ArrowRightIcon size={16} weight="bold" aria-hidden className="transition-transform duration-500 group-hover:translate-x-1" />
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </button>
        <p
          role="status"
          aria-live="polite"
          className={`max-w-[44ch] text-sm ${status === "failed" ? "text-[#ff9aa6]" : "text-smoke"}`}
        >
          {notice ||
            "Your message goes straight to the team inbox. Your email is only used to reply to you."}
          {status === "failed" && email && (
            <>
              {" "}
              You can also email{" "}
              <a href={`mailto:${email}`} className="text-bone underline">
                {email}
              </a>
              .
            </>
          )}
        </p>
      </div>
    </form>
  );
}
