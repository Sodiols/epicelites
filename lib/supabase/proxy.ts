import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";
import { authCookieOptions, REMEMBER_COOKIE } from "./cookies";

const SIGNED_OUT_PAGES = ["/EEAUTHOR/forgot", "/EEAUTHOR/reset", "/EEAUTHOR/auth/"];

/**
 * Refreshes the admin's Supabase session on every /EEAUTHOR request and writes the renewed
 * cookies to both the request (for Server Components) and the response (for the browser).
 * It also redirects signed-out visitors to the login page as a convenience. It is not the
 * security boundary: every page, Server Action and route handler re-checks authorization.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const remember = request.cookies.get(REMEMBER_COOKIE)?.value !== "0";

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, authCookieOptions(options, remember));
        }
      },
    },
  });

  // getClaims() verifies the JWT and refreshes an expired session. Nothing may run between
  // creating the client and this call, or sessions can be dropped unpredictably.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const path = request.nextUrl.pathname;
  const open =
    path === "/EEAUTHOR" || path.startsWith("/EEAUTHOR/api/") || SIGNED_OUT_PAGES.some((p) => path.startsWith(p));

  if (!signedIn && !open) {
    const url = request.nextUrl.clone();
    url.pathname = "/EEAUTHOR";
    url.search = "";
    url.searchParams.set("reason", "signin");
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
