/** Public navigation and shared helpers. Team content itself now comes from Supabase (lib/data/public.ts). */

export const nav = [
  { href: "/roster", label: "Roster" },
  { href: "/matches", label: "Matches" },
  { href: "/media", label: "Media" },
  { href: "/news", label: "News" },
  { href: "/about", label: "About" },
] as const;

export const pad = (n: number) => String(n).padStart(2, "0");
