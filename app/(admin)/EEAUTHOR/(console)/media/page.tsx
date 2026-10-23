import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ListBulletsIcon, PlayIcon, SquaresFourIcon, VideoIcon, ArrowsDownUpIcon } from "@phosphor-icons/react/ssr";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader, EmptyState, FilterTabs, Badge } from "@/components/admin/ui";
import { MediaUploader } from "@/components/admin/media-uploader";
import { MediaItemActions, MediaOrder } from "@/components/admin/media-item-actions";
import { MEDIA_CATEGORIES } from "@/lib/labels";
import { youTubeId } from "@/lib/video";

export const metadata: Metadata = { title: "Media" };

type Search = { view?: string; type?: string; category?: string; status?: string; upload?: string };

export default async function MediaAdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : sp.view === "order" ? "order" : "grid";
  const status = sp.status === "published" || sp.status === "draft" ? sp.status : "all";

  let query = admin.supabase
    .from("media_items")
    .select("id, kind, category, title, caption, alt_text, url, video_url, width, height, on_black, is_published, is_featured, display_order, player_id, created_at")
    .order("is_featured", { ascending: false })
    .order("display_order")
    .limit(500);
  if (sp.type === "image" || sp.type === "video") query = query.eq("kind", sp.type);
  if (sp.category && sp.category in MEDIA_CATEGORIES) query = query.eq("category", sp.category as keyof typeof MEDIA_CATEGORIES);
  if (status !== "all") query = query.eq("is_published", status === "published");

  const [{ data }, { data: players }] = await Promise.all([query, admin.supabase.from("players").select("id, display_name")]);
  const names = new Map((players ?? []).map((p) => [p.id, p.display_name]));
  const items = (data ?? []).map((m) => {
    const vid = m.video_url ? youTubeId(m.video_url) : null;
    return {
      ...m,
      label: m.title || m.caption || (m.player_id ? names.get(m.player_id) : null) || m.alt_text || "Untitled",
      thumb: m.url ?? (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : null),
    };
  });

  const href = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ view, type: sp.type, category: sp.category, status, ...patch })) {
      if (v && !(k === "view" && v === "grid") && !(k === "status" && v === "all")) p.set(k, v);
    }
    const s = p.toString();
    return `/EEAUTHOR/media${s ? `?${s}` : ""}`;
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Media"
        description="Photos, graphics and videos for the gallery. Files live in Supabase Storage; only published items reach the website."
        actions={
          <>
            <Link href="/EEAUTHOR/media/new" className="a-btn a-btn-secondary">
              <VideoIcon size={16} aria-hidden /> Add video link
            </Link>
            <MediaUploader startOpen={sp.upload === "1"} />
          </>
        }
      />

      <FilterTabs
        active={status}
        items={[
          { key: "all", label: "All", href: href({ status: "all" }) },
          { key: "published", label: "Published", href: href({ status: "published" }) },
          { key: "draft", label: "Drafts", href: href({ status: "draft" }) },
        ]}
      />

      <form method="get" className="flex flex-wrap items-end gap-2">
        {view !== "grid" && <input type="hidden" name="view" value={view} />}
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <label className="grid gap-1">
          <span className="a-label">Type</span>
          <select name="type" defaultValue={sp.type ?? ""} className="a-input">
            <option value="">Images and videos</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="a-label">Category</span>
          <select name="category" defaultValue={sp.category ?? ""} className="a-input">
            <option value="">All categories</option>
            {Object.entries(MEDIA_CATEGORIES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="a-btn a-btn-secondary">
          Apply
        </button>
        <div className="ml-auto flex border border-line" role="group" aria-label="View">
          {(
            [
              ["grid", "Grid", SquaresFourIcon],
              ["list", "List", ListBulletsIcon],
              ["order", "Reorder", ArrowsDownUpIcon],
            ] as const
          ).map(([v, l, Icon]) => (
            <Link key={v} href={href({ view: v })} aria-current={view === v ? "page" : undefined} className={`a-btn a-btn-sm ${view === v ? "bg-graphite text-bone" : "a-btn-ghost"}`}>
              <Icon size={16} aria-hidden /> {l}
            </Link>
          ))}
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState title="No media here" body="Upload images or add a YouTube link. New uploads start as drafts so you can add alt text before publishing." />
      ) : view === "order" ? (
        <>
          <p className="a-help">Gallery order on the website. Featured items always come first.</p>
          <MediaOrder items={items.map((i) => ({ id: i.id, label: i.label, thumb: i.thumb, published: i.is_published, featured: i.is_featured }))} />
        </>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((m) => (
            <li key={m.id} className="group a-panel relative">
              <Link href={`/EEAUTHOR/media/${m.id}`} className="relative block aspect-square overflow-hidden bg-night">
                {m.thumb && (
                  <Image
                    src={m.thumb}
                    alt={m.alt_text ?? ""}
                    fill
                    sizes="(min-width: 1280px) 15vw, (min-width: 640px) 30vw, 45vw"
                    className={`object-contain transition-transform duration-500 group-hover:scale-[1.03] ${m.on_black ? "mix-blend-lighten" : ""}`}
                  />
                )}
                {m.kind === "video" && (
                  <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center bg-violet text-night">
                    <PlayIcon size={18} weight="fill" aria-label="Video" />
                  </span>
                )}
              </Link>
              <div className="flex items-start gap-1 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{m.label}</p>
                  <p className="mt-1 flex flex-wrap gap-1">
                    {m.is_published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
                    {m.is_featured && <Badge tone="violet">Featured</Badge>}
                    {!m.alt_text && m.kind === "image" && <Badge tone="amber">No alt text</Badge>}
                  </p>
                </div>
                <MediaItemActions id={m.id} label={m.label} published={m.is_published} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="border-t border-line">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border-b border-line px-2 py-2 hover:bg-carbon">
              <span className="relative size-14 shrink-0 overflow-hidden bg-night">
                {m.thumb && <Image src={m.thumb} alt="" fill sizes="56px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <Link href={`/EEAUTHOR/media/${m.id}`} className="block truncate font-medium hover:text-violet">
                  {m.label}
                </Link>
                <span className="text-xs text-smoke">
                  {m.kind === "video" ? "Video" : `Image${m.width ? `, ${m.width} × ${m.height}` : ""}`}, {MEDIA_CATEGORIES[m.category]}
                </span>
              </span>
              <span className="hidden gap-1 sm:flex">
                {m.is_published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
                {m.is_featured && <Badge tone="violet">Featured</Badge>}
              </span>
              <MediaItemActions id={m.id} label={m.label} published={m.is_published} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
