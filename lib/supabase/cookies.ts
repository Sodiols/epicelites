import type { CookieOptions } from "@supabase/ssr";

/** Set to "0" at sign-in when the admin did not tick "Keep me signed in". */
export const REMEMBER_COOKIE = "ee-remember";

/**
 * Hardens Supabase auth cookies. When the admin chose not to be remembered, the persistence
 * attributes are dropped so the session ends when the browser closes.
 */
export function authCookieOptions(options: CookieOptions, remember: boolean): CookieOptions {
  const hardened: CookieOptions = {
    ...options,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  // maxAge 0 is a deletion; never turn that into a session cookie.
  if (!remember && options.maxAge !== 0) {
    delete hardened.maxAge;
    delete hardened.expires;
  }
  return hardened;
}
