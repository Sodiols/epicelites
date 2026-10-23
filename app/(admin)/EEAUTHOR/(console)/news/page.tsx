import type { Metadata } from "next";
import Link from "next/link";
import { NotePencilIcon } from "@phosphor-icons/react/ssr";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, EmptyState, FilterTabs, Badge } from "@/components/admin/ui";
import { NewsStatusBadge } from "@/components/admin/status";
import { NEWS_CATEGORIES } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "News" };

type Tab = "all" | "published" | "scheduled" | "drafts" | "archived";

export default async function NewsAdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; category?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const tab: Tab = (["published", "scheduled", "drafts", "archived"] as const).find((t) => t === sp.tab) ?? "all";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const now = new Date().toISOString();
  const db = admin.supabase;

  let query = db
    .from("news_posts")
    .select("id, title, slug, status, published_at, category, is_featured, updated_at, author_name")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (tab === "published") query = query.eq("status", "published").lte("published_at", now);
  if (tab === "scheduled") query = query.eq("status", "published").gt("published_at", now);
  if (tab === "drafts") query = query.eq("status", "draft");
  if (tab === "archived") query = query.eq("status", "archived");
  if (sp.category && sp.category in NEWS_CATEGORIES) query = query.eq("category", sp.category as keyof typeof NEWS_CATEGORIES);
  if (q) query = query.or(`title.ilike.%${q.replace(/[%_,()]/g, "")}%,summary.ilike.%${q.replace(/[%_,()]/g, "")}%`);

  const [{ data: posts }, all] = await Promise.all([query, db.from("news_posts").select("status, published_at")]);
  const counts = { all: 0, published: 0, scheduled: 0, drafts: 0, archived: 0 };
  for (const p of all.data ?? []) {
    counts.all++;
    if (p.status === "draft") counts.drafts++;
    else if (p.status === "archived") counts.archived++;
    else if (p.published_at && p.published_at > now) counts.scheduled++;
    else counts.published++;
  }
  const link = (t: Tab) => `/EEAUTHOR/news${t === "all" ? "" : `?tab=${t}`}`;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="News"
        description="Write, schedule and publish team announcements."
        actions={
          <Link href="/EEAUTHOR/news/new" className="a-btn a-btn-primary">
            <NotePencilIcon size={16} aria-hidden />
            Create News
          </Link>
        }
      />
      <FilterTabs
        active={tab}
        items={(["all", "published", "scheduled", "drafts", "archived"] as Tab[]).map((t) => ({
          key: t,
          label: t[0].toUpperCase() + t.slice(1),
          href: link(t),
          count: counts[t],
        }))}
      />
      <form method="get" role="search" className="flex flex-wrap items-end gap-2">
        {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
        <label className="grid min-w-56 flex-1 gap-1">
          <span className="a-label">Search</span>
          <input name="q" type="search" defaultValue={q} placeholder="Headline or summary…" className="a-input" />
        </label>
        <label className="grid gap-1">
          <span className="a-label">Category</span>
          <select name="category" defaultValue={sp.category ?? ""} className="a-input">
            <option value="">All categories</option>
            {Object.entries(NEWS_CATEGORIES).map(([v, l]) => (
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

      {(posts ?? []).length === 0 ? (
        <EmptyState
          title="No articles here"
          body="Articles you create appear in this list. Drafts and scheduled posts are never visible to visitors."
          action={
            <Link href="/EEAUTHOR/news/new" className="a-btn a-btn-primary a-btn-sm">
              Create News
            </Link>
          }
        />
      ) : (
        <ul className="border-t border-line">
          {(posts ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-line px-3 py-3 hover:bg-carbon">
              <span className="min-w-0 flex-1 basis-64">
                <Link href={`/EEAUTHOR/news/${p.id}`} className="block truncate font-medium hover:text-violet">
                  {p.title}
                </Link>
                <span className="text-xs text-smoke">
                  {NEWS_CATEGORIES[p.category]}
                  {p.author_name ? `, by ${p.author_name}` : ""}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <NewsStatusBadge status={p.status} publishedAt={p.published_at} />
                {p.is_featured && <Badge tone="violet">Featured</Badge>}
              </span>
              <span className="w-48 text-right text-xs text-smoke">
                {p.published_at ? formatDateTime(p.published_at) : `Edited ${formatDateTime(p.updated_at)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
