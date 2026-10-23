"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon, UploadSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { registerUploads } from "@/app/(admin)/EEAUTHOR/(console)/media/actions";
import { MEDIA_CATEGORIES } from "@/lib/labels";
import { snappy } from "@/lib/motion";
import { uploadImage, validateFile } from "./image-upload";
import { useToast } from "./toast";

type Job = { id: number; name: string; progress: number; state: "uploading" | "done" | "error"; message?: string };

/**
 * Bulk upload: drop or pick several images, each uploads with its own progress bar, then
 * the successful ones are registered in the library as drafts in one step.
 */
export function MediaUploader({ startOpen = false }: { startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [category, setCategory] = useState("team");
  const [over, setOver] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const run = async (files: FileList | File[]) => {
    const list = [...files].slice(0, 25);
    const base = Date.now();
    const initial: Job[] = list.map((f, i) => {
      const problem = validateFile(f);
      return { id: base + i, name: f.name, progress: 0, state: problem ? "error" : "uploading", message: problem ?? undefined };
    });
    setJobs((j) => [...initial, ...j].slice(0, 40));

    const results = await Promise.all(
      list.map(async (file, i) => {
        if (initial[i].state === "error") return null;
        const set = (patch: Partial<Job>) => setJobs((js) => js.map((j) => (j.id === initial[i].id ? { ...j, ...patch } : j)));
        try {
          const img = await uploadImage(file, "media", (p) => set({ progress: p }));
          set({ state: "done", progress: 100 });
          return { url: img.url, path: img.path ?? "", width: img.width, height: img.height, name: file.name };
        } catch (e) {
          set({ state: "error", message: e instanceof Error ? e.message : "Upload failed." });
          return null;
        }
      }),
    );

    const ok = results.filter((r): r is NonNullable<typeof r> => r !== null);
    if (ok.length === 0) return;
    startTransition(async () => {
      const r = await registerUploads(ok, category);
      toast(r.ok ? "success" : "error", r.ok ? (r.message ?? "Uploaded") : r.message);
      if (r.ok) router.refresh();
    });
  };

  if (!open) {
    return (
      <button type="button" className="a-btn a-btn-primary" onClick={() => setOpen(true)}>
        <UploadSimpleIcon size={16} aria-hidden />
        Upload Media
      </button>
    );
  }

  return (
    <section aria-label="Upload images" className="a-panel col-span-full grid gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1">
          <span className="a-label">Category for these uploads</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="a-input">
            {Object.entries(MEDIA_CATEGORIES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="a-btn a-btn-ghost ml-auto" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          run(e.dataTransfer.files);
        }}
        className={`grid cursor-pointer place-items-center gap-2 border border-dashed px-6 py-10 text-center text-sm transition-colors ${
          over ? "border-violet bg-violet/10 text-bone" : "border-line text-smoke hover:border-smoke"
        }`}
      >
        <UploadSimpleIcon size={28} aria-hidden />
        <span>
          Drop images here or <span className="text-violet underline">browse</span>
        </span>
        <span className="text-xs">JPEG, PNG, WebP or AVIF. Up to 25 at a time. Converted to WebP and resized to 2400 px at most.</span>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => e.target.files && run(e.target.files)} />
      </label>
      {jobs.length > 0 && (
        <ul className="grid gap-1.5" aria-live="polite">
          <AnimatePresence initial={false}>
            {jobs.map((j) => (
              <motion.li key={j.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={snappy} className="grid grid-cols-[1fr_auto] items-center gap-x-3 text-sm">
                <span className="truncate">{j.name}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  {j.state === "done" && <CheckIcon size={14} className="text-violet" aria-label="Uploaded" />}
                  {j.state === "error" && <WarningCircleIcon size={14} className="text-[#ff9aa6]" aria-hidden />}
                  <span className={j.state === "error" ? "text-[#ff9aa6]" : "font-mono text-smoke tabular-nums"}>
                    {j.state === "error" ? j.message : `${j.progress}%`}
                  </span>
                </span>
                <span className="col-span-2 h-0.5 bg-line">
                  <motion.span
                    className={`block h-full origin-left ${j.state === "error" ? "bg-[#ff7a8a]" : "bg-violet"}`}
                    animate={{ scaleX: j.state === "error" ? 1 : j.progress / 100 }}
                    transition={{ ease: "linear", duration: 0.2 }}
                  />
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
