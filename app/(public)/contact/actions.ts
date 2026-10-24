"use server";

import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, formToObject } from "@/lib/validations/common";
import { CONTACT_TURNSTILE_ACTION } from "@/lib/turnstile";
import { turnstileEnabled, verifyTurnstile } from "@/lib/turnstile-server";

export type ContactResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100, "Keep your name under 100 characters."),
  email: z.string().trim().max(200).email("Enter an email address like you@example.com."),
  topic: z.enum(["partnership", "tournament", "media", "general"], { message: "Choose what your message is about." }),
  message: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters so the team knows what you need.")
    .max(5000, "Keep your message under 5000 characters."),
});

const MIN_FILL_MS = 3_000;
const MAX_FORM_AGE_MS = 24 * 60 * 60_000;
const MAX_LINKS = 3;

/**
 * Stores a visitor inquiry. Server Actions only accept same-origin POSTs; when Turnstile is
 * configured the token is verified before anything else runs; a honeypot field, a minimum
 * fill time and a link limit catch simple bots; the payload is validated here and again by
 * database constraints; and three throttles apply: per IP on this server, per sender email
 * and site-wide in the database.
 */
export async function submitContact(form: FormData): Promise<ContactResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "The contact inbox is not set up yet, so messages cannot be received." };
  }

  const raw = formToObject(form);
  if (JSON.stringify(raw).length > 12_000) return { ok: false, message: "That message is too long to send." };

  const ip = await clientIp();

  if (turnstileEnabled()) {
    const check = await verifyTurnstile(form.get("cf-turnstile-response"), CONTACT_TURNSTILE_ACTION, ip);
    if (!check.ok) {
      return {
        ok: false,
        message:
          check.reason === "misconfigured"
            ? "Messages cannot be verified right now. Please email the team directly instead."
            : check.reason === "unavailable"
              ? "The verification service did not respond. Wait a moment and send again."
              : "The verification check failed or expired. Complete it again and send.",
      };
    }
  }

  // Honeypot: a field real visitors never see. Pretend success so bots learn nothing.
  if (raw.website) return { ok: true };

  // Time trap: the form records when it was shown. Scripts post instantly; people take seconds.
  const shownAt = Number(raw.started_at);
  const elapsed = Date.now() - shownAt;
  if (!Number.isFinite(shownAt) || elapsed < MIN_FILL_MS) {
    return { ok: false, message: "That was sent too quickly. Check your message and send it again." };
  }
  if (elapsed > MAX_FORM_AGE_MS) {
    return { ok: false, message: "This page has been open too long. Reload it and send your message again." };
  }

  // Link limit: real inquiries rarely need more than a few links; spam usually carries many.
  const links = (raw.message ?? "").match(/https?:\/\/|www\./gi)?.length ?? 0;
  if (links > MAX_LINKS) {
    return {
      ok: false,
      message: `Messages can include at most ${MAX_LINKS} links.`,
      fieldErrors: { message: `Remove some links; ${MAX_LINKS} at most.` },
    };
  }

  const limit = rateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return { ok: false, message: `Too many messages from this connection. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.` };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  const { error } = await createAnonClient().rpc("submit_contact_message", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_category: parsed.data.topic,
    p_message: parsed.data.message,
  });

  if (error) {
    if (error.message.includes("rate_limited")) {
      return { ok: false, message: "You have sent several messages recently. Try again in an hour." };
    }
    console.error("contact submission failed", error.code);
    return { ok: false, message: "Your message could not be saved. Nothing was sent; please try again shortly." };
  }

  return { ok: true };
}
