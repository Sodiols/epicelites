import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const ADMIN = "/EEAUTHOR";

export async function proxy(request: NextRequest) {
  // URL paths are case-sensitive: send /eeauthor, /EEauthor/... etc. to the real admin path.
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith(ADMIN)) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN + pathname.slice(ADMIN.length);
    return NextResponse.redirect(url, 308);
  }
  return updateSession(request);
}

// Only the admin area uses sessions; public pages stay cookie-free and cacheable.
// The character classes also catch any other capitalisation of the admin path.
export const config = {
  matcher: ["/:admin([eE][eE][aA][uU][tT][hH][oO][rR])", "/:admin([eE][eE][aA][uU][tT][hH][oO][rR])/:path*"],
};
