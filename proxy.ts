import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only the admin area uses sessions; public pages stay cookie-free and cacheable.
export const config = {
  matcher: ["/EEAUTHOR", "/EEAUTHOR/:path*"],
};
