import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { authorize } from "@/lib/auth/admin";
import { MEDIA_BUCKET } from "@/lib/supabase/env";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MB = Number(process.env.MEDIA_MAX_UPLOAD_MB ?? 10);
const FOLDERS = new Set(["players", "news", "media", "partners", "matches", "brand"]);

/** Identify the real format from the file's first bytes, ignoring the declared MIME type. */
function sniff(buf: Buffer): "jpeg" | "png" | "webp" | "avif" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 4, 8) === "ftyp" && /^avi[fs]$/.test(buf.toString("ascii", 8, 12))) return "avif";
  return null;
}

const fail = (status: number, message: string) => NextResponse.json({ ok: false, message }, { status });

/**
 * Image upload for the dashboard.
 * 1. Same-origin request from a signed-in, active administrator only.
 * 2. Size limit, then real format detection (JPEG, PNG, WebP, AVIF; nothing executable).
 * 3. Re-encoded with sharp: EXIF orientation applied, metadata stripped, longest side capped,
 *    saved as WebP. Re-encoding also neutralises polyglot files.
 * 4. Stored under a random path with the admin's own session, so Storage RLS applies too.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) {
    return fail(403, "Cross-site uploads are not allowed.");
  }

  const auth = await authorize();
  if (!auth.ok) return fail(401, auth.result.message);
  const { admin } = auth;

  if (!rateLimit(`upload:${admin.userId}`, 60, 10 * 60_000).ok) {
    return fail(429, "Too many uploads in a short time. Wait a few minutes and try again.");
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > (MAX_MB + 1) * 1024 * 1024) return fail(413, `Files must be ${MAX_MB} MB or smaller.`);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "The upload could not be read.");
  }

  const file = form.get("file");
  const folder = String(form.get("folder") ?? "media");
  if (!(file instanceof File)) return fail(400, "Choose a file to upload.");
  if (!FOLDERS.has(folder)) return fail(400, "Unknown upload destination.");
  if (file.size > MAX_MB * 1024 * 1024) return fail(413, `Files must be ${MAX_MB} MB or smaller.`);

  const input = Buffer.from(await file.arrayBuffer());
  if (!sniff(input)) return fail(415, "Use a JPEG, PNG, WebP or AVIF image.");

  const maxSide = folder === "brand" ? 1200 : 2400;
  let output: Buffer;
  let width: number;
  let height: number;
  try {
    const result = await sharp(input, { limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 100, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    output = result.data;
    width = result.info.width;
    height = result.info.height;
  } catch {
    return fail(415, "That image could not be processed. It may be damaged.");
  }

  const now = new Date();
  const path = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.webp`;

  const { error } = await admin.supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, output, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) return fail(500, "Storage rejected the upload. Check that the media bucket exists.");

  const { data } = admin.supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, path, width, height, bytes: output.length });
}
