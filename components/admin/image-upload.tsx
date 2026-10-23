"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { ImageSquareIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";

export type UploadedImage = { url: string; path: string | null; width: number | null; height: number | null };

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_MB = Number(process.env.NEXT_PUBLIC_MEDIA_MAX_UPLOAD_MB ?? 10);

/** XHR rather than fetch, because fetch cannot report upload progress. */
export function uploadImage(file: File, folder: string, onProgress: (pct: number) => void) {
  return new Promise<UploadedImage>((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/EEAUTHOR/api/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: { ok?: boolean; message?: string; url?: string; path?: string; width?: number; height?: number } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.ok && data.url) {
        resolve({ url: data.url, path: data.path ?? null, width: data.width ?? null, height: data.height ?? null });
      } else reject(new Error(data.message ?? "Upload failed."));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(body);
  });
}

export function validateFile(file: File): string | null {
  if (!ACCEPT.split(",").includes(file.type)) return "Use a JPEG, PNG, WebP or AVIF image.";
  if (file.size > MAX_MB * 1024 * 1024) return `Files must be ${MAX_MB} MB or smaller.`;
  return null;
}

/**
 * Single-image field: drop a file or browse, watch it upload, see the result. Writes
 * hidden inputs ({name}_url, {name}_path, {name}_width, {name}_height) so the surrounding
 * form saves the reference with the record.
 */
export function ImageUpload({
  name,
  label,
  folder,
  initial,
  help,
  aspect = "aspect-[4/3]",
  fit = "object-contain",
  onChange,
  allowClear = true,
}: {
  name: string;
  label: string;
  folder: string;
  initial?: UploadedImage | null;
  help?: string;
  aspect?: string;
  fit?: "object-contain" | "object-cover";
  onChange?: (img: UploadedImage | null) => void;
  allowClear?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<UploadedImage | null>(initial ?? null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const set = (img: UploadedImage | null) => {
    setImage(img);
    onChange?.(img);
    // Let the enclosing form know it changed (unsaved-changes tracking).
    queueMicrotask(() => hiddenRef.current?.dispatchEvent(new Event("change", { bubbles: true })));
  };

  const handle = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateFile(file);
    if (problem) return setError(problem);
    setError(null);
    setProgress(0);
    try {
      set(await uploadImage(file, folder, setProgress));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-1.5">
      <span className="a-label" id={`${id}-label`}>
        {label}
      </span>
      <input ref={hiddenRef} type="hidden" name={`${name}_url`} value={image?.url ?? ""} />
      <input type="hidden" name={`${name}_path`} value={image?.path ?? ""} />
      <input type="hidden" name={`${name}_width`} value={image?.width ?? ""} />
      <input type="hidden" name={`${name}_height`} value={image?.height ?? ""} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files[0]);
        }}
        className={`relative grid overflow-hidden border border-dashed transition-colors ${aspect} ${
          over ? "border-violet bg-violet/10" : "border-line bg-night"
        }`}
      >
        {image ? (
          <Image
            src={image.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 24rem, 90vw"
            className={`${fit} p-2`}
          />
        ) : (
          <span className="grid place-items-center gap-2 p-6 text-center text-sm text-smoke">
            <ImageSquareIcon size={28} aria-hidden />
            Drop an image here
          </span>
        )}

        {progress !== null && (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-labelledby={`${id}-label`}>
            <motion.span
              className="block h-full origin-left bg-violet"
              animate={{ scaleX: progress / 100 }}
              transition={{ ease: "linear", duration: 0.2 }}
            />
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          aria-describedby={help ? `${id}-help` : undefined}
          onChange={(e) => handle(e.target.files?.[0])}
        />
        <label htmlFor={id} className="a-btn a-btn-secondary a-btn-sm cursor-pointer">
          <UploadSimpleIcon size={14} aria-hidden />
          {progress !== null ? `Uploading ${progress}%` : image ? "Replace" : "Choose image"}
        </label>
        {image && allowClear && (
          <button type="button" className="a-btn a-btn-ghost a-btn-sm" onClick={() => set(null)}>
            <TrashIcon size={14} aria-hidden />
            Remove
          </button>
        )}
        {image?.width && image.height && (
          <span className="font-mono text-xs text-smoke tabular-nums">
            {image.width} × {image.height}
          </span>
        )}
      </div>
      {help && (
        <p id={`${id}-help`} className="a-help">
          {help}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-[#ff9aa6]">
          {error}
        </p>
      )}
    </div>
  );
}
