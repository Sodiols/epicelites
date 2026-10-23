/**
 * Time zone helpers. Matches are stored as UTC instants plus the IANA zone they were
 * scheduled in, so "8:00 PM in Dhaka" stays 8:00 PM in Dhaka for every visitor.
 */

export const DEFAULT_TIME_ZONE = "Asia/Dhaka";

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function partsIn(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}

function offsetMs(date: Date, tz: string): number {
  const p = partsIn(date, tz);
  return Date.UTC(+p.y, +p.m - 1, +p.d, +p.h, +p.mi, +p.s) - date.getTime();
}

/** "2026-11-18T20:00" entered for `tz` → the UTC instant it represents. */
export function zonedInputToUtc(local: string, tz: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match || !isValidTimeZone(tz)) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let ts = guess - offsetMs(new Date(guess), tz);
  ts = guess - offsetMs(new Date(ts), tz); // second pass settles DST boundaries
  return new Date(ts);
}

/** UTC instant → value for <input type="datetime-local"> in `tz`. */
export function utcToZonedInput(iso: string, tz: string): string {
  const p = partsIn(new Date(iso), isValidTimeZone(tz) ? tz : DEFAULT_TIME_ZONE);
  return `${p.y}-${p.m}-${p.d}T${p.h}:${p.mi}`;
}

/** Calendar date (YYYY-MM-DD) of an instant in `tz`. */
export function zonedDateKey(iso: string, tz: string): string {
  const p = partsIn(new Date(iso), tz);
  return `${p.y}-${p.m}-${p.d}`;
}

export function formatMatchTime(iso: string, tz: string) {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
  return { day, time, full: `${day}, ${time}` };
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DEFAULT_TIME_ZONE,
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function relativeTime(iso: string, now = Date.now()) {
  const diff = new Date(iso).getTime() - now;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  return "just now";
}

/** IANA zones for the picker, with the team's default first. */
export function timeZoneOptions(): string[] {
  const all =
    typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [DEFAULT_TIME_ZONE, "UTC"];
  return [DEFAULT_TIME_ZONE, ...all.filter((z) => z !== DEFAULT_TIME_ZONE)];
}
