import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, EmptyState, FilterTabs, Badge } from "@/components/admin/ui";
import { MarkReadOnOpen, MessageActions } from "@/components/admin/message-actions";
import { INQUIRY_CATEGORIES } from "@/lib/labels";
import { formatDateTime, relativeTime } from "@/lib/time";
import { uuid } from "@/lib/validations/common";

export const metadata: Metadata = { title: "Messages" };

type Search = { status?: string; category?: string; q?: string; id?: string };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const status = sp.status === "unread" || sp.status === "read" || sp.status === "archived" ? sp.status : "all";
  const q = (sp.q ?? "").trim().slice(0, 80).replace(/[%_,()]/g, "");
  const db = admin.supabase;

  let query = db.from("contact_messages").select("id, name, email, category, message, status, created_at").order("created_at", { ascending: false }).limit(200);
  if (status === "all") query = query.neq("status", "archived");
  else query = query.eq("status", status);
  if (sp.category && sp.category in INQUIRY_CATEGORIES) query = query.eq("category", sp.category as keyof typeof INQUIRY_CATEGORIES);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,message.ilike.%${q}%`);

  const selectedId = sp.id && uuid.safeParse(sp.id).success ? sp.id : null;
  const [{ data: messages }, { data: selected }, counts] = await Promise.all([
    query,
    selectedId ? db.from("contact_messages").select("*").eq("id", selectedId).maybeSingle() : Promise.resolve({ data: null }),
    db.from("contact_messages").select("status"),
  ]);
  const tally = (counts.data ?? []).reduce<Record<string, number>>((a, m) => ((a[m.status] = (a[m.status] ?? 0) + 1), a), {});

  const href = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ status, category: sp.category, q: sp.q, id: undefined, ...patch })) {
      if (v && !(k === "status" && v === "all")) p.set(k, v);
    }
    const s = p.toString();
    return `/EEAUTHOR/messages${s ? `?${s}` : ""}`;
  };

  const reply = selected
    ? `mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(`Re: your ${INQUIRY_CATEGORIES[selected.category].toLowerCase()} for Epic Elites`)}&body=${encodeURIComponent(
        `\n\n---\nOn ${formatDateTime(selected.created_at)}, ${selected.name} wrote:\n> ${selected.message.split("\n").join("\n> ")}`,
      )}`
    : "";

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Messages"
        description="Inquiries sent through the website's contact form. Replies are written in your own email app; this site does not send email."
      />
      <FilterTabs
        active={status}
        items={[
          { key: "all", label: "Inbox", href: href({ status: "all" }), count: (tally.unread ?? 0) + (tally.read ?? 0) },
          { key: "unread", label: "Unread", href: href({ status: "unread" }), count: tally.unread ?? 0 },
          { key: "read", label: "Read", href: href({ status: "read" }), count: tally.read ?? 0 },
          { key: "archived", label: "Archived", href: href({ status: "archived" }), count: tally.archived ?? 0 },
        ]}
      />
      <form method="get" role="search" className="flex flex-wrap items-end gap-2">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <label className="grid min-w-56 flex-1 gap-1">
          <span className="a-label">Search</span>
          <input name="q" type="search" defaultValue={sp.q ?? ""} placeholder="Name, email or message text…" className="a-input" />
        </label>
        <label className="grid gap-1">
          <span className="a-label">Inquiry type</span>
          <select name="category" defaultValue={sp.category ?? ""} className="a-input">
            <option value="">All types</option>
            {Object.entries(INQUIRY_CATEGORIES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="a-btn a-btn-secondary">
          Apply
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className={selected ? "hidden lg:block" : ""}>
          {(messages ?? []).length === 0 ? (
            <EmptyState title="No messages" body="When visitors use the contact form, their inquiries arrive here. New ones also appear live in the sidebar count." />
          ) : (
            <ul className="border-t border-line">
              {(messages ?? []).map((m) => (
                <li key={m.id}>
                  <Link
                    href={href({ id: m.id })}
                    aria-current={m.id === selectedId ? "true" : undefined}
                    className={`block border-b border-line px-3 py-3 transition-colors hover:bg-carbon aria-[current=true]:bg-graphite ${m.status === "unread" ? "border-l-2 border-l-violet" : ""}`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={`truncate ${m.status === "unread" ? "font-semibold" : ""}`}>{m.name}</span>
                      <time dateTime={m.created_at} className="shrink-0 text-xs text-smoke">
                        {relativeTime(m.created_at)}
                      </time>
                    </span>
                    <span className="mt-0.5 block text-xs text-violet">{INQUIRY_CATEGORIES[m.category]}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-smoke">{m.message}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <section aria-label="Message" className={selected ? "" : "hidden lg:block"}>
          {selected ? (
            <article className="a-panel grid gap-5 p-5 sm:p-6">
              <MarkReadOnOpen id={selected.id} status={selected.status} />
              <Link href={href({})} className="text-sm text-smoke hover:text-bone lg:hidden">
                ← All messages
              </Link>
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{selected.name}</h2>
                  <p className="text-sm text-smoke">
                    <a href={`mailto:${selected.email}`} className="hover:text-bone">
                      {selected.email}
                    </a>
                  </p>
                </div>
                <div className="text-right text-sm">
                  <Badge tone="violet">{INQUIRY_CATEGORIES[selected.category]}</Badge>
                  <p className="mt-1 text-xs text-smoke">{formatDateTime(selected.created_at)}</p>
                </div>
              </header>
              <p className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              <MessageActions id={selected.id} status={selected.status} replyHref={reply} />
            </article>
          ) : (
            <div className="grid h-full min-h-60 place-items-center border border-dashed border-line text-sm text-smoke">Select a message to read it.</div>
          )}
        </section>
      </div>
    </div>
  );
}
