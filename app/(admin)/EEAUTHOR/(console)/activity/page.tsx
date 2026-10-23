import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { describeActivity, RESOURCE_TYPES } from "@/lib/admin/activity";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Activity log" };

const PAGE = 50;

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ type?: string; action?: string; page?: string; actor?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const actor = (sp.actor ?? "").trim().slice(0, 120).replace(/[%_,()]/g, "");

  let query = admin.supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("occurred_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (sp.type && RESOURCE_TYPES.some((r) => r.key === sp.type)) query = query.eq("resource_type", sp.type);
  if (sp.action === "insert" || sp.action === "update" || sp.action === "delete") query = query.eq("action", sp.action);
  if (actor) query = query.ilike("actor_email", `%${actor}%`);
  const { data, count } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (sp.type) params.set("type", sp.type);
    if (sp.action) params.set("action", sp.action);
    if (actor) params.set("actor", actor);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/EEAUTHOR/activity${s ? `?${s}` : ""}`;
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Activity log"
        description="Every change to site content, recorded by the database itself. Entries cannot be edited or deleted from the dashboard."
      />
      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1">
          <span className="a-label">Area</span>
          <select name="type" defaultValue={sp.type ?? ""} className="a-input">
            <option value="">Everything</option>
            {RESOURCE_TYPES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="a-label">Change</span>
          <select name="action" defaultValue={sp.action ?? ""} className="a-input">
            <option value="">Any</option>
            <option value="insert">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
          </select>
        </label>
        <label className="grid min-w-52 gap-1">
          <span className="a-label">Administrator</span>
          <input name="actor" type="search" defaultValue={actor} placeholder="Email contains…" className="a-input" />
        </label>
        <button type="submit" className="a-btn a-btn-secondary">
          Apply
        </button>
      </form>

      {(data ?? []).length === 0 ? (
        <EmptyState title="No activity recorded" body="Changes appear here as soon as they are saved." />
      ) : (
        <ol className="border-t border-line">
          {(data ?? []).map((row) => {
            const d = describeActivity(row);
            return (
              <li key={row.id} className="grid gap-1 border-b border-line px-3 py-3 text-sm md:grid-cols-[11rem_1fr_14rem] md:gap-4">
                <time dateTime={row.occurred_at} className="font-mono text-xs text-smoke tabular-nums">
                  {formatDateTime(row.occurred_at)}
                </time>
                <span className="min-w-0">
                  <span className="font-medium">{d.title}</span>
                  {d.label && (
                    <>
                      {": "}
                      {d.href ? (
                        <Link href={d.href} className="text-violet hover:underline">
                          {d.label}
                        </Link>
                      ) : (
                        d.label
                      )}
                    </>
                  )}
                  {d.detail && <span className="block text-xs break-words text-smoke">{d.detail}</span>}
                  {row.resource_id && <span className="block font-mono text-[0.6875rem] text-smoke/70">ID {row.resource_id}</span>}
                </span>
                <span className="truncate text-xs text-smoke md:text-right">{row.actor_email ?? "Website visitor or system"}</span>
              </li>
            );
          })}
        </ol>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="a-btn a-btn-secondary a-btn-sm">
              Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-smoke">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="a-btn a-btn-secondary a-btn-sm">
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
