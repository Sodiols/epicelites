# Epic Elites: Supabase and admin setup

This guide takes a fresh Supabase project to a working site with the private dashboard at `/EEAUTHOR`. Nothing here requires editing source code.

## Step 1: Create the Supabase project

1. Sign in at [supabase.com](https://supabase.com), choose **New project**, pick a region close to your players (for Bangladesh, Singapore `ap-southeast-1` is usually closest), and set a strong database password. Keep that password in a password manager; the website never needs it.
2. In **Authentication > Sign In / Providers > Email**:
   - keep **Email** enabled;
   - turn **off** "Allow new users to sign up". Administrators are created by you (Step 4), never by public sign-up.
3. In **Authentication > URL Configuration**:
   - **Site URL**: your production address, e.g. `https://epicelites.gg` (use `http://localhost:3000` while developing).
   - **Redirect URLs**: add `http://localhost:3000/EEAUTHOR/auth/confirm` and `https://YOUR-DOMAIN/EEAUTHOR/auth/confirm`.
4. In **Authentication > Emails > Reset Password**, replace the link in the template with:

   ```html
   <a href="{{ .SiteURL }}/EEAUTHOR/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/EEAUTHOR/reset">Reset your password</a>
   ```

   This lets the reset link work in any browser. (The default template also works, but only in the same browser that requested the reset.)
5. For production email delivery, configure custom SMTP under **Authentication > Emails > SMTP Settings**. Supabase's built-in sender is rate limited and meant for testing.

## Step 2: Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings > API** (or the **Connect** dialog): Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Project Settings > API Keys**: the `sb_publishable_...` key. Older projects may use the legacy anon key instead, via `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `NEXT_PUBLIC_SITE_URL` | Your site's origin, no trailing slash. `http://localhost:3000` locally. |

The publishable key is designed to be public: Row Level Security decides what it can do. **Never** add a `service_role` or secret key to this project; nothing needs one.

Optional:

- `MEDIA_MAX_UPLOAD_MB` / `NEXT_PUBLIC_MEDIA_MAX_UPLOAD_MB`: upload size limit (default 10, matching the bucket limit).
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` and `TURNSTILE_HOSTNAMES`: Cloudflare Turnstile on the contact form. The site key (`0x4AAAAAAFiyKoePy1cMAbWZ`) is public. Copy the secret from **Cloudflare > Turnstile > your widget** straight into `.env.local` and your host's secret settings; never commit it or paste it into chats or tickets. `TURNSTILE_HOSTNAMES` lists the domains allowed to issue tokens (your real domains in production); the widget's hostname list in Cloudflare must include the same domains. Cloudflare does not allow `localhost` on a widget, so for local development use Cloudflare's public test keys (site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`), as `.env.example` shows. The server accepts test-key results only when not running in production, so they can never switch the check off on the live site. Once either key is set, every submission must pass verification: a missing secret or hostname list makes the form refuse messages rather than skip the check.

While these variables are missing, the public site runs in setup mode from `content/team.json` and the dashboard explains that Supabase is not connected. Once they are set, Supabase is the only source of truth: if the database is unreachable or not migrated, pages show an error instead of stale content.

## Step 3: Run the SQL migrations

**Option A, SQL Editor (simplest).** Open **SQL Editor > New query**, paste the whole of `supabase/setup-all.sql`, and run it. Running it again later is safe: it keeps existing tables and content and only adds what is missing. It contains, in order:

| File | What it creates |
| --- | --- |
| `migrations/20261023000100_core_schema.sql` | Tables, constraints, indexes, `updated_at` triggers |
| `migrations/20261023000200_security.sql` | Admin role functions, Row Level Security, grants, public read-only views, contact submission and admin-management functions |
| `migrations/20261023000300_audit_storage.sql` | Audit triggers, the `media` Storage bucket and its policies, realtime for the inbox |
| `seed.sql` | The six current players with their portraits, team settings, the gallery, and the kit announcement as an unpublished draft |

**Option B, Supabase CLI.**

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Then run `supabase/seed.sql` in the SQL Editor.

The seed is safe to run more than once; it never duplicates or overwrites records you have edited. After changing `content/team.json` before first setup, regenerate it with `npm run seed:generate` and rebundle with `npm run sql:bundle`.

## Step 4: Create the first administrator

1. **Authentication > Users > Add user > Create new user.** Enter the owner's email and a strong password (or send an invite). Tick "Auto Confirm User" if you create the password yourself. No password is stored in this repository.
2. In **SQL Editor**, run (with that email):

   ```sql
   select public.bootstrap_owner('owner@example.com');
   ```

   This works only from the SQL Editor (not through the website or API) and only while no active owner exists.

To add more people later, create their account the same way, then grant them **Owner** or **Editor** access from `/EEAUTHOR/administrators`.

| Role | Can do |
| --- | --- |
| Owner | Everything, including adding, changing, disabling and removing administrators |
| Editor | All content: matches, results, players, news, media, partners, messages, settings. Cannot see or change administrators. |

The last active owner can never be removed, disabled or demoted; the database refuses it.

## Step 5: Storage

The migration creates a public bucket named `media` with a 10 MB limit and only image types allowed (WebP, JPEG, PNG, AVIF). Check it under **Storage**; nothing else is required.

How it is protected:

- Uploading, replacing, listing and deleting require an active administrator (Storage RLS policies). Anonymous visitors cannot do any of them.
- Every upload goes through `/EEAUTHOR/api/upload`, which checks the session, the file size and the real file type (by its bytes, not its name), then re-encodes it to WebP with metadata stripped.
- Files get random, unguessable paths. A public bucket serves any object by its URL (that is what lets images be cached by CDNs), so an unpublished image is private only in the sense that nobody can find or list it. Do not upload anything that must stay confidential.

To change the size limit, update the bucket in **Storage > media > Edit bucket** and set `MEDIA_MAX_UPLOAD_MB` to match.

## Step 6: Start the website

```bash
npm install
npm run dev
```

Open http://localhost:3000. The public site now reads from Supabase.

## Step 7: Access the admin

Go to http://localhost:3000/EEAUTHOR and sign in with the owner account from Step 4. You land on `/EEAUTHOR/dashboard`.

- **Keep me signed in** keeps you signed in across browser restarts. Leave it off on shared computers: the session then ends when the browser closes.
- **Forgot your password?** sends a reset link (Step 1.4).
- The `/EEAUTHOR` address is not linked anywhere, is excluded from the sitemap and robots file, and sends `noindex` and `no-store` headers. Hiding it is not the protection, though: every admin page, Server Action and upload re-checks the session and role, and the database enforces the same rules with Row Level Security.

## Step 8: Deploy

This site needs a server (sign-in, Server Actions, on-demand regeneration), so deploy it as a normal Next.js app, not a static export. Vercel works with no extra configuration; any Node.js host that runs `npm run build` and `npm start` also works.

1. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL` (your real domain, `https://...`) in the host's environment settings. They must be present at **build** time: the Supabase host is baked into the image configuration.
2. In Supabase, set the production **Site URL** and add the production `/EEAUTHOR/auth/confirm` redirect URL (Step 1.3).
3. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` and `TURNSTILE_HOSTNAMES` (production domains only) as well.
4. In the dashboard, set **Website Settings > Website domain** to the same domain. It drives canonical links, the sitemap and sharing images.
5. Deploy. Public pages are regenerated at most every 60 seconds, and immediately after any dashboard change.

## How publishing reaches the site

- Every save in the dashboard expires the cached public data, so the next visitor sees the change. No rebuild or redeploy is involved.
- Scheduled news and anything else time-based rely on the database's clock: articles are visible once `published_at` has passed, checked on every read, and cached pages refresh at least once a minute. A scheduled post therefore goes live within a minute of its time with nobody signed in.
- Visitors never receive draft, scheduled, unconfirmed or private data: public pages read only through database views that filter it out, and those views are the only thing the public key can read.

## Security notes

- **Revoking access.** Disabling or removing an administrator takes effect on their very next request; the database refuses their reads and writes from that moment. Their sign-in session itself remains valid until it expires (one hour by default, refreshed while active). To end it immediately as well, use **Authentication > Users > ... > Sign out user**, or delete the user.
- **Rate limits.** Sign-in (per IP and per email), password reset requests, uploads and contact submissions are throttled in the app; Supabase Auth applies its own limits, and the database throttles contact messages per sender and site-wide. The in-app limits are per server instance; on a multi-instance host, Supabase's limits and the database throttle still apply globally.
- **CSRF.** Server Actions only accept same-origin requests (Next.js checks the Origin header). The upload route checks Origin itself. Session cookies are `SameSite=Lax`, `HttpOnly` and `Secure` in production.
- **Content safety.** News articles use a small Markdown subset rendered by an allow-list renderer that escapes everything else, so article text can never inject scripts. Links and images must be `https://` or site-relative.
- **Audit log.** Written only by database triggers. No role, including owners, can insert, edit or delete entries through the API. Message contents and other long text are never copied into it.

## Verifying the security model

`npm run test:db` runs every migration and the seed inside PGlite (Postgres compiled to WebAssembly), with stand-ins for Supabase's `auth` and `storage` schemas, and checks access as an anonymous visitor, a signed-in non-admin, an editor and an owner. It covers draft and scheduled visibility, unconfirmed results, privilege escalation, last-owner protection, storage writes, audit integrity and contact throttling.

## Things that need your input

- **Turnstile in production:** set `TURNSTILE_SECRET_KEY` and `TURNSTILE_HOSTNAMES` (your real domains) in the host, and make sure the widget in Cloudflare lists those domains.
- **Email delivery for password resets** needs custom SMTP for production volume (Step 1.5).
- **Fixtures in `content/team.json`** are not imported automatically (the file has free-text dates). It currently has none; enter future fixtures in the dashboard.
