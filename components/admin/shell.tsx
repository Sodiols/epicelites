"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDotsIcon,
  ChatsCircleIcon,
  ClockCounterClockwiseIcon,
  GearSixIcon,
  HandshakeIcon,
  ImagesIcon,
  ListIcon,
  NewspaperIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SquaresFourIcon,
  TrophyIcon,
  UsersThreeIcon,
  XIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { snappy } from "@/lib/motion";
import { signOut } from "@/app/(admin)/EEAUTHOR/actions";
import { ToastProvider } from "./toast";

type NavItem = { href: string; label: string; icon: React.ElementType; ownerOnly?: boolean; badge?: "messages" };

const GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [{ href: "/EEAUTHOR/dashboard", label: "Dashboard", icon: SquaresFourIcon }] },
  {
    title: "Competition",
    items: [
      { href: "/EEAUTHOR/matches", label: "Matches", icon: CalendarDotsIcon },
      { href: "/EEAUTHOR/results", label: "Results", icon: TrophyIcon },
    ],
  },
  {
    title: "Team",
    items: [
      { href: "/EEAUTHOR/players", label: "Players", icon: UsersThreeIcon },
      { href: "/EEAUTHOR/partners", label: "Partners", icon: HandshakeIcon },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/EEAUTHOR/news", label: "News", icon: NewspaperIcon },
      { href: "/EEAUTHOR/media", label: "Media", icon: ImagesIcon },
    ],
  },
  {
    title: "Communication",
    items: [{ href: "/EEAUTHOR/messages", label: "Messages", icon: ChatsCircleIcon, badge: "messages" }],
  },
  {
    title: "System",
    items: [
      { href: "/EEAUTHOR/settings", label: "Website Settings", icon: GearSixIcon },
      { href: "/EEAUTHOR/administrators", label: "Administrators", icon: ShieldCheckIcon, ownerOnly: true },
      { href: "/EEAUTHOR/activity", label: "Activity Log", icon: ClockCounterClockwiseIcon },
    ],
  },
];

type Props = {
  children: React.ReactNode;
  admin: { email: string; displayName: string | null; role: "owner" | "editor" };
  unread: number;
  logoUrl: string;
};

/** New inquiries bump the badge live (Realtime respects RLS, so only admins receive them). */
function useUnreadCount(initial: number) {
  const [count, setCount] = useState(initial);
  useEffect(() => setCount(initial), [initial]);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, () =>
        setCount((c) => c + 1),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  return count;
}

function Nav({ role, unread, onNavigate }: { role: Props["admin"]["role"]; unread: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="grid gap-6">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1.5 text-[0.6875rem] font-semibold tracking-[0.08em] text-smoke uppercase">{group.title}</p>
          <ul className="grid gap-px">
            {group.items
              .filter((i) => !i.ownerOnly || role === "owner")
              .map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href} className="relative">
                    {active && (
                      <motion.span layoutId="admin-nav" transition={snappy} className="absolute inset-0 bg-graphite">
                        <span className="absolute inset-y-1.5 left-0 w-0.5 bg-violet" />
                      </motion.span>
                    )}
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                        active ? "text-bone" : "text-smoke hover:text-bone"
                      }`}
                    >
                      <Icon size={18} weight={active ? "fill" : "regular"} aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      {item.badge === "messages" && unread > 0 && (
                        <span className="min-w-5 bg-violet px-1.5 text-center font-mono text-[0.6875rem] font-semibold text-night tabular-nums">
                          <span className="sr-only">Unread: </span>
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Account({ admin }: { admin: Props["admin"] }) {
  return (
    <div className="grid gap-3 border-t border-line pt-4">
      <div className="min-w-0 px-3">
        <p className="truncate text-sm font-medium">{admin.displayName ?? admin.email}</p>
        <p className="truncate text-xs text-smoke">
          {admin.role === "owner" ? "Owner" : "Editor"}
          {admin.displayName ? `, ${admin.email}` : ""}
        </p>
      </div>
      <div className="grid gap-px">
        <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 px-3 py-2 text-sm text-smoke hover:text-bone">
          <ArrowSquareOutIcon size={18} aria-hidden />
          View website
        </a>
        <form action={signOut}>
          <button type="submit" className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-smoke hover:text-bone">
            <SignOutIcon size={18} aria-hidden />
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({ children, admin, unread: initialUnread, logoUrl }: Props) {
  const [open, setOpen] = useState(false);
  const unread = useUnreadCount(initialUnread);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const brand = (
    <Link href="/EEAUTHOR/dashboard" className="flex items-center gap-2.5 px-3">
      <Image src={logoUrl} alt="" width={30} height={22} className="h-[22px] w-[30px] object-contain" />
      <span className="grid leading-none">
        <span className="font-display text-lg">Epic Elites</span>
        <span className="text-[0.625rem] font-semibold tracking-[0.12em] text-smoke uppercase">Control room</span>
      </span>
    </Link>
  );

  return (
    <ToastProvider>
      <a
        href="#admin-main"
        className="fixed top-3 left-3 z-[100] -translate-y-[200%] bg-violet px-4 py-3 text-sm font-semibold text-night focus:translate-y-0"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-6 overflow-y-auto border-r border-line bg-night px-3 py-5 lg:flex">
        {brand}
        <div className="flex-1">
          <Nav role={admin.role} unread={unread} />
        </div>
        <Account admin={admin} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-night/90 px-2 backdrop-blur lg:hidden">
        {brand}
        <button
          type="button"
          className="a-btn a-btn-ghost a-btn-icon"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="admin-drawer"
          onClick={() => setOpen(true)}
        >
          <ListIcon size={20} />
          {unread > 0 && <span className="absolute top-2.5 right-2.5 size-2 bg-violet" aria-hidden />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close navigation" tabIndex={-1} className="absolute inset-0 bg-night/70" onClick={() => setOpen(false)} />
            <motion.aside
              id="admin-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col gap-6 overflow-y-auto border-r border-line bg-night px-3 py-4"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={snappy}
            >
              <div className="flex items-center justify-between">
                {brand}
                <button type="button" className="a-btn a-btn-ghost a-btn-icon" aria-label="Close navigation" onClick={() => setOpen(false)} autoFocus>
                  <XIcon size={20} />
                </button>
              </div>
              <div className="flex-1">
                <Nav role={admin.role} unread={unread} onNavigate={() => setOpen(false)} />
              </div>
              <Account admin={admin} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="admin-main" className="min-h-[100dvh] px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
    </ToastProvider>
  );
}
