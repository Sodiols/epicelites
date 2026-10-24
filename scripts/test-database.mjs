// Runs the real migrations and seed inside PGlite (Postgres compiled to WebAssembly)
// against a minimal stand-in for Supabase's auth and storage schemas, then checks the
// security model as each kind of caller: anonymous visitor, signed-in non-admin,
// editor and owner.
//
// Usage: npm run test:db

import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite();

const OWNER = "00000000-0000-4000-8000-000000000001";
const EDITOR = "00000000-0000-4000-8000-000000000002";
const OUTSIDER = "00000000-0000-4000-8000-000000000003";

let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? `\n      ${detail}` : ""}`);
};

/** Run SQL as a given role and (optionally) signed-in user. Returns { rows, error }. */
async function as(role, user, sql, params = []) {
  try {
    await db.exec("reset role;");
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user ?? ""]);
    if (role !== "postgres") await db.exec(`set role ${role};`);
    const res = await db.query(sql, params);
    return { rows: res.rows, affected: res.affectedRows ?? 0, error: null };
  } catch (error) {
    return { rows: [], affected: 0, error };
  } finally {
    await db.exec("reset role;");
  }
}
const anon = (sql, p) => as("anon", null, sql, p);
const user = (id, sql, p) => as("authenticated", id, sql, p);
const pg = (sql, p) => as("postgres", null, sql, p);

// --- Supabase stand-ins -----------------------------------------------------
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text unique);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;

  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id), name text, owner uuid);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;

  -- Supabase grants broad defaults on everything created in public; mimic that so the
  -- migrations' own revokes are what is actually being tested.
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;

  insert into auth.users values
    ('${OWNER}', 'owner@example.test'),
    ('${EDITOR}', 'editor@example.test'),
    ('${OUTSIDER}', 'someone@example.test');
`);

// --- Migrations + seed --------------------------------------------------------
const migrationsDir = join(root, "supabase/migrations");
for (const file of readdirSync(migrationsDir).sort()) {
  await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
  console.log(`applied ${file}`);
}
await db.exec(readFileSync(join(root, "supabase/seed.sql"), "utf8"));
// Re-running must be harmless: every migration again, then the whole bundled setup file,
// exactly what happens when someone pastes setup-all.sql into a database that already has it.
for (const file of readdirSync(migrationsDir).sort()) {
  await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
}
await db.exec(readFileSync(join(root, "supabase/setup-all.sql"), "utf8"));
console.log("re-applied every migration, seed and setup-all.sql without errors\n");

// --- Seed integrity -------------------------------------------------------------
let r = await pg("select count(*)::int n from public.players");
check("seed keeps exactly six players after running twice", r.rows[0].n === 6, JSON.stringify(r.rows));
r = await pg("select count(*)::int n from public.media_items");
check("seed creates seven gallery items once", r.rows[0].n === 7, JSON.stringify(r.rows));
r = await pg("select status, published_at from public.news_posts");
check("kit announcement is a draft with no invented date", r.rows.length === 1 && r.rows[0].status === "draft" && r.rows[0].published_at === null);

// --- Bootstrap -------------------------------------------------------------------
r = await user(OWNER, "select public.bootstrap_owner('owner@example.test')");
check("bootstrap_owner is not callable through the API", r.error !== null);
r = await pg("select public.bootstrap_owner('owner@example.test')");
check("bootstrap_owner works from the SQL editor", r.error === null, r.error?.message);
r = await pg("select public.bootstrap_owner('editor@example.test')");
check("bootstrap_owner refuses once an owner exists", r.error !== null);

// --- Anonymous visitor -------------------------------------------------------------
r = await anon("select count(*)::int n from public.public_players");
check("anon reads the six public players", r.rows[0]?.n === 6, r.error?.message);
r = await anon("select * from public.players");
check("anon cannot read the players table directly", r.error !== null);
r = await anon("select count(*)::int n from public.public_media");
check("anon reads published gallery media", r.rows[0]?.n === 7, r.error?.message);
const team = JSON.parse(readFileSync(join(root, "content/team.json"), "utf8"));
const firstPlayer = team.players.find((p) => p.image === "player-01-hd.webp");
r = await anon("select caption from public.public_media where url = '/images/player-01-hd.webp'");
check("player gallery captions follow the player's name", r.rows[0]?.caption === firstPlayer?.name, JSON.stringify(r.rows));
r = await anon("select count(*)::int n from public.public_news");
check("draft news is not public", r.rows[0]?.n === 0);
for (const t of ["contact_messages", "audit_logs", "admin_users", "news_posts", "matches", "team_settings"]) {
  r = await anon(`select * from public.${t}`);
  check(`anon cannot select ${t}`, r.error !== null);
}
r = await anon("insert into public.news_posts (slug, title) values ('x', 'x')");
check("anon cannot insert news", r.error !== null);
r = await anon("update public.players set display_name = 'hacked'");
check("anon cannot update players", r.error !== null);
r = await anon("insert into storage.objects (bucket_id, name) values ('media', 'evil.webp')");
check("anon cannot upload to storage", r.error !== null);

// --- Contact form ---------------------------------------------------------------------
r = await anon("select public.submit_contact_message('Rafi', 'rafi@example.test', 'general', 'Hello, we would like to invite you.') id");
check("anon can submit a contact message", r.error === null && r.rows[0]?.id, r.error?.message);
await anon("select public.submit_contact_message('Rafi', 'rafi@example.test', 'general', 'Second message here.')");
await anon("select public.submit_contact_message('Rafi', 'RAFI@example.test', 'general', 'Third message here.')");
r = await anon("select public.submit_contact_message('Rafi', 'rafi@example.test', 'general', 'Fourth message here.')");
check("fourth message from the same email within an hour is rate limited", r.error?.message?.includes("rate_limited"), r.error?.message);
r = await anon("select public.submit_contact_message('A', 'bad-email', 'general', 'Hello there team')");
check("invalid email is rejected by the database", r.error !== null);
r = await anon("select public.submit_contact_message('A', 'a@b.co', 'spam', 'Hello there team')");
check("unknown inquiry category is rejected", r.error !== null);

// --- Signed-in user who is not an administrator ------------------------------------------
r = await user(OUTSIDER, "select count(*)::int n from public.players");
check("non-admin sees no rows in players", r.rows[0]?.n === 0, r.error?.message);
r = await user(OUTSIDER, "insert into public.players (slug, display_name) values ('intruder', 'Intruder')");
check("non-admin cannot insert players", r.error !== null);
r = await user(OUTSIDER, "insert into public.admin_users (user_id, email, role) values ($1, 'someone@example.test', 'owner')", [OUTSIDER]);
check("non-admin cannot make themselves an admin", r.error !== null);
r = await user(OUTSIDER, "select public.admin_grant_access('someone@example.test', 'owner')");
check("non-admin cannot call admin_grant_access", r.error !== null);
r = await user(OUTSIDER, "select count(*)::int n from public.contact_messages");
check("non-admin cannot read inquiries", r.rows[0]?.n === 0);

// --- Owner grants an editor -------------------------------------------------------------
r = await user(OWNER, "select public.admin_grant_access('editor@example.test', 'editor', 'Editor')");
check("owner grants editor access", r.error === null, r.error?.message);
r = await user(OWNER, "select public.admin_grant_access('nobody@example.test', 'editor')");
check("granting an unknown email fails cleanly", r.error?.message?.includes("No account"));

// --- Editor --------------------------------------------------------------------------
r = await user(EDITOR, "update public.admin_users set role = 'owner' where user_id = $1", [EDITOR]);
check("editor cannot promote themselves to owner", r.affected === 0);
r = await pg("select role from public.admin_users where user_id = $1", [EDITOR]);
check("editor role is unchanged", r.rows[0]?.role === "editor");
r = await user(EDITOR, "select count(*)::int n from public.admin_users");
check("editor only sees their own admin row", r.rows[0]?.n === 1);
r = await user(EDITOR, "select count(*)::int n from public.contact_messages");
check("editor reads the inbox", r.rows[0]?.n === 3, JSON.stringify(r));

r = await user(
  EDITOR,
  `insert into public.matches (format, scoring, event_name, stage, starts_at, time_zone)
   values ('battle_royale', 'placement', 'Test Cup', 'Group A', now() + interval '3 days', 'Asia/Dhaka') returning id`,
);
const matchId = r.rows[0]?.id;
check("editor schedules a draft match", !!matchId, r.error?.message);
r = await anon("select count(*)::int n from public.public_matches");
check("draft match is not public", r.rows[0]?.n === 0);
await user(EDITOR, "update public.matches set is_published = true where id = $1", [matchId]);
r = await anon("select count(*)::int n from public.public_matches");
check("published match is public", r.rows[0]?.n === 1);

r = await user(EDITOR, "update public.matches set br_placement = 2, br_kills = 14, br_total_points = 41 where id = $1", [matchId]);
check("editor records a provisional result", r.error === null, r.error?.message);
r = await user(EDITOR, "update public.matches set result_confirmed = true where id = $1", [matchId]);
check("result cannot be confirmed before the match is completed", r.error !== null);
r = await anon("select br_placement from public.public_matches where id = $1", [matchId]);
check("unconfirmed result stays hidden from the public", r.rows[0]?.br_placement === null);
r = await user(EDITOR, "update public.matches set status = 'completed', completed_at = now(), result_confirmed = true where id = $1", [matchId]);
check("editor completes and confirms the result", r.error === null, r.error?.message);
r = await anon("select br_placement, br_kills from public.public_matches where id = $1", [matchId]);
check("confirmed result is public", r.rows[0]?.br_placement === 2 && r.rows[0]?.br_kills === 14);
r = await user(EDITOR, "update public.matches set h2h_team_score = 3 where id = $1", [matchId]);
check("head-to-head score cannot be stored on a placement match", r.error !== null);

r = await user(EDITOR, `insert into public.news_posts (slug, title, status, published_at) values ('later', 'Later', 'published', now() + interval '1 day')`);
check("editor schedules a post", r.error === null, r.error?.message);
await user(EDITOR, `insert into public.news_posts (slug, title, status, published_at) values ('now', 'Now', 'published', now() - interval '1 minute')`);
r = await anon("select slug from public.public_news order by slug");
check("only the post whose time has passed is public", r.rows.length === 1 && r.rows[0].slug === "now", JSON.stringify(r.rows));
r = await user(EDITOR, `insert into public.news_posts (slug, title, status) values ('broken', 'Broken', 'published')`);
check("published post without a date is rejected", r.error !== null);
r = await user(EDITOR, `insert into public.players (slug, display_name, photo_url) values ('xss', 'X', 'javascript:alert(1)')`);
check("javascript: image URLs are rejected", r.error !== null);

r = await user(EDITOR, "insert into storage.objects (bucket_id, name) values ('media', 'abc/def.webp')");
check("editor can upload to the media bucket", r.error === null, r.error?.message);

r = await user(EDITOR, "delete from public.audit_logs");
check("editor cannot erase the audit log", r.error !== null || r.affected === 0);
r = await user(EDITOR, "insert into public.audit_logs (action, resource_type) values ('forged', 'players')");
check("editor cannot forge audit entries", r.error !== null);

// --- Owner safety rails -----------------------------------------------------------------
r = await user(OWNER, "update public.admin_users set role = 'editor' where user_id = $1", [OWNER]);
check("the last owner cannot demote themselves", r.error?.message?.includes("last active owner"), r.error?.message);
r = await user(OWNER, "update public.admin_users set is_active = false where user_id = $1", [EDITOR]);
check("owner can disable an editor", r.error === null && r.affected === 1, r.error?.message);
r = await user(EDITOR, "select count(*)::int n from public.players");
check("a disabled editor immediately loses data access", r.rows[0]?.n === 0);
r = await user(EDITOR, "update public.players set role = 'IGL'");
check("a disabled editor cannot change content", r.affected === 0);

// --- Audit trail ---------------------------------------------------------------------------
r = await user(OWNER, "select action, resource_type, actor_email, summary from public.audit_logs order by id");
const logs = r.rows;
check("audit log records changes with the responsible admin", logs.some((l) => l.resource_type === "matches" && l.actor_email === "editor@example.test"));
check("audit log records status transitions", logs.some((l) => (l.summary ?? "").includes("status: upcoming to completed")), JSON.stringify(logs.filter((l) => l.resource_type === "matches")));
check("audit log never copies inquiry text", !logs.some((l) => (l.summary ?? "").includes("invite")));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
