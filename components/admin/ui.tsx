import Link from "next/link";

/** Page title row. Titles use the display face; everything else stays readable sans. */
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="text-sm text-smoke hover:text-bone">
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display mt-1 text-[clamp(2.25rem,4vw,3.25rem)] leading-[0.9]">{title}</h1>
        {description && <p className="mt-2 max-w-[60ch] text-sm text-smoke">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

const TONES = {
  neutral: "border-line text-smoke",
  violet: "border-violet/50 bg-violet/10 text-[#c2b0ff]",
  solid: "border-violet bg-violet text-night",
  green: "border-[#2f5a43] bg-[#122219] text-[#8fe0b1]",
  amber: "border-[#5a4a2a] bg-[#211b10] text-[#f0c879]",
  red: "border-[#5c2a33] bg-[#1d0f13] text-[#ff9aa6]",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center border px-1.5 py-0.5 text-[0.6875rem] font-semibold whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid justify-items-start gap-3 border border-dashed border-line px-6 py-10">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-[52ch] text-sm text-smoke">{body}</p>
      {action}
    </div>
  );
}

/** Underlined tab-style filter links that live in the URL, so filtered views can be shared and reloaded. */
export function FilterTabs({
  items,
  active,
}: {
  items: { href: string; label: string; count?: number; key: string }[];
  active: string;
}) {
  return (
    <nav aria-label="Filter" className="-mb-px flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]">
      {items.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors ${
              on ? "text-bone" : "text-smoke hover:text-bone"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && <span className="ml-1.5 font-mono text-xs text-smoke tabular-nums">{t.count}</span>}
            {on && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-violet" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function NotConfigured() {
  return (
    <EmptyState
      title="Supabase is not connected"
      body="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, run the migrations, then reload. See SETUP.md."
    />
  );
}
