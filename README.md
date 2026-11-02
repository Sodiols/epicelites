# Epic Elites website

The official site for Epic Elites, a Free Fire esports team, with a private content dashboard. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Motion and Supabase (Postgres, Auth, Storage).

**First time? Follow [SETUP.md](SETUP.md)** to create the Supabase project, run the migrations and create the first administrator.

## Run it

```bash
npm install
npm run dev
```

- Website: http://localhost:3000
- Dashboard: http://localhost:3000/EEAUTHOR (not linked anywhere on the site)

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript check |
| `npm run test:seo` | Checks canonical origin normalization, production fallbacks and site identity |
| `npm run test:db` | Runs the migrations in PGlite and checks every access rule |
| `npm run seed:generate` | Rebuilds `supabase/seed.sql` from `content/team.json` |
| `npm run sql:bundle` | Rebuilds `supabase/setup-all.sql` (all migrations plus seed) |

## Managing content

Everything is edited in the dashboard; no code changes or redeploys are needed.

| Section | What it manages |
| --- | --- |
| Dashboard | Live counts, next match, latest result, recent activity, quick actions |
| Matches | Schedule (list and calendar), publish, postpone, cancel, duplicate, delete; Battle Royale and head-to-head formats; event time zones |
| Results | Matches waiting for a result, results awaiting confirmation, confirmed results with map-by-map rounds |
| Players | Roster order, profiles, photos, roles, jersey numbers, active/inactive, featured lineup |
| Partners | Sponsors and partners (shown on About only when real records exist) |
| News | Drafts, scheduling, publishing, archiving, preview, SEO fields |
| Media | Gallery uploads, YouTube videos, alt text, ordering, publishing |
| Messages | Contact form inbox with live updates |
| Website Settings | Team identity, socials, logo, favicon, jersey artwork, homepage and About text |
| Administrators | Owner-only: grant, change, disable and revoke access |
| Activity Log | Every content change, who made it and when |

## Project layout

| Path | Contents |
| --- | --- |
| `app/(public)/` | The public site; URLs are unchanged |
| `app/(admin)/EEAUTHOR/` | Login, password reset and the dashboard (`(console)/`) |
| `components/` | Public components; `components/admin/` holds the dashboard UI |
| `lib/supabase/` | Browser, server, public (cached) clients, proxy session refresh, database types |
| `lib/data/public.ts` | Every public read, through filtered database views |
| `lib/auth/admin.ts` | Server-side admin verification used by every page and action |
| `lib/validations/` | Input schemas for every form |
| `supabase/migrations/` | Schema, Row Level Security, Storage and audit SQL |
| `proxy.ts` | Session refresh for `/EEAUTHOR` (Next.js 16 proxy convention) |

`content/team.json` is only the seed source and the setup-mode fallback before Supabase is connected. Once Supabase is configured, the database is the single source of truth.

The previous static version of the site is kept in `_legacy-static/` for reference and can be deleted.

## Search identity and deployment checks

`lib/site-identity.ts` defines the official search name (`EPIC ELITES`) and canonical origin policy.
Website Settings > Site URL takes precedence over `NEXT_PUBLIC_SITE_URL`; keep both on the
same public HTTPS origin. The current production fallback is `https://epicelites.vercel.app`.
Update it when moving to a custom domain. Request headers and automatic Vercel preview URLs
are never used to choose canonical URLs. Production rejects insecure URLs and localhost.

The homepage publishes linked `WebSite` and `SportsTeam` JSON-LD; news articles identify the
same website and publisher. Canonicals, Open Graph URLs, robots.txt and sitemap.xml use the
same origin. Existing crest assets supply the ICO, SVG, PNG and Apple icons; the PNG icon is
192x192 and the ICO includes a 48x48 image. No Vercel favicon is used.

Before release, run `npm run test:seo`, `npm run typecheck` and `npm run build`. Check rendered
homepage, `/news` and a published article for a single canonical, `og:site_name=EPIC ELITES`,
matching social titles and valid JSON-LD. Fetch `/favicon.ico`, `/icon-192.png`, `/robots.txt`
and `/sitemap.xml` from the deployed hostname, and confirm the sitemap includes published
articles and excludes private/admin routes. Validate homepage `WebSite` JSON-LD with Schema
Markup Validator (Google's Rich Results Test does not test site names).

After deployment, use Google Search Console URL Inspection to request a homepage recrawl
and submit `/sitemap.xml`. Google's choice of site name and favicon can take days or weeks
to refresh; successful local checks do not confirm that Google has updated its index.
