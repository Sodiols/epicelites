"use client";

import { useId, useRef, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import {
  ImageIcon,
  LinkSimpleIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  QuotesIcon,
  TextBIcon,
  TextHTwoIcon,
  TextHThreeIcon,
  TextItalicIcon,
} from "@phosphor-icons/react";
import { renderMarkdown } from "@/lib/markdown";
import { snappy } from "@/lib/motion";
import { uploadImage, validateFile } from "./image-upload";

type Mode = "write" | "preview" | "split";

/**
 * Article body editor. Text is stored as a small Markdown subset (see lib/markdown.ts);
 * the toolbar inserts it so editors never need to remember the syntax, and the preview
 * uses the exact renderer the public article page uses.
 */
export function MarkdownEditor({ name, defaultValue, error }: { name: string; defaultValue: string; error?: string }) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<Mode>("split");
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const apply = (fn: (sel: string) => { text: string; cursor?: number }, block = false) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = value.slice(s, e);
    const { text } = fn(selected);
    let before = value.slice(0, s);
    if (block && before && !before.endsWith("\n\n")) before += before.endsWith("\n") ? "\n" : "\n\n";
    const next = before + text + value.slice(e);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = before.length + text.length;
      el.setSelectionRange(pos, pos);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  const prefixLines = (prefix: (i: number) => string) => (sel: string) => ({
    text: (sel || "List item").split("\n").map((l, i) => `${prefix(i)}${l}`).join("\n") + "\n",
  });

  const tools = [
    { label: "Heading", icon: TextHTwoIcon, run: () => apply((s) => ({ text: `## ${s || "Heading"}\n\n` }), true) },
    { label: "Subheading", icon: TextHThreeIcon, run: () => apply((s) => ({ text: `### ${s || "Subheading"}\n\n` }), true) },
    { label: "Bold", icon: TextBIcon, run: () => apply((s) => ({ text: `**${s || "bold text"}**` })) },
    { label: "Italic", icon: TextItalicIcon, run: () => apply((s) => ({ text: `*${s || "italic text"}*` })) },
    { label: "Bulleted list", icon: ListBulletsIcon, run: () => apply(prefixLines(() => "- "), true) },
    { label: "Numbered list", icon: ListNumbersIcon, run: () => apply(prefixLines((i) => `${i + 1}. `), true) },
    { label: "Quote", icon: QuotesIcon, run: () => apply((s) => ({ text: `> ${s || "Quote"}\n\n` }), true) },
    {
      label: "Link",
      icon: LinkSimpleIcon,
      run: () => {
        const url = window.prompt("Link address (https://… or a page on this site like /roster)");
        if (!url) return;
        apply((s) => ({ text: `[${s || "link text"}](${url.trim()})` }));
      },
    },
  ];

  const insertImage = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateFile(file);
    if (problem) return setUploadError(problem);
    setUploadError(null);
    setUploading(0);
    try {
      const img = await uploadImage(file, "news", setUploading);
      const alt = window.prompt("Describe the image for people who cannot see it", "") ?? "";
      apply(() => ({ text: `![${alt.replace(/[\[\]]/g, "")}](${img.url})\n\n` }), true);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="a-label">
          Article body <span className="text-smoke">(required to publish)</span>
        </label>
        <LayoutGroup id={`${id}-mode`}>
          <div role="tablist" aria-label="Editor view" className="flex border border-line">
            {(["write", "split", "preview"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`relative px-3 py-1 text-xs font-semibold capitalize ${mode === m ? "text-night" : "text-smoke hover:text-bone"} ${m === "split" ? "hidden lg:block" : ""}`}
              >
                {mode === m && <motion.span layoutId="md-mode" className="absolute inset-0 bg-violet" transition={snappy} />}
                <span className="relative">{m === "split" ? "Side by side" : m}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </div>

      <div className={`grid gap-3 ${mode === "split" ? "lg:grid-cols-2" : ""}`}>
        <div className={mode === "preview" ? "hidden" : "grid"}>
          <div role="toolbar" aria-label="Formatting" className="flex flex-wrap border border-b-0 border-line bg-carbon">
            {tools.map(({ label, icon: Icon, run }) => (
              <button key={label} type="button" onClick={run} aria-label={label} title={label} className="grid size-9 place-items-center text-smoke hover:bg-graphite hover:text-bone">
                <Icon size={17} />
              </button>
            ))}
            <label title="Insert image" className="grid size-9 cursor-pointer place-items-center text-smoke hover:bg-graphite hover:text-bone">
              <span className="sr-only">Insert image</span>
              <ImageIcon size={17} aria-hidden />
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => insertImage(e.target.files?.[0])} />
            </label>
            {uploading !== null && <span className="self-center px-2 font-mono text-xs text-smoke">Uploading {uploading}%</span>}
          </div>
          <textarea
            ref={ref}
            id={id}
            name={name}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={22}
            maxLength={50000}
            aria-invalid={error ? true : undefined}
            className="a-input min-h-96 font-mono text-[0.8125rem] leading-relaxed"
            placeholder={"Write the article. Leave a blank line between paragraphs.\n\n## A heading\n\n- A list item"}
          />
        </div>
        {mode !== "write" && (
          <div className="min-h-96 overflow-auto border border-line bg-night p-5" aria-label="Preview">
            {value.trim() ? (
              <div className="article-body text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
            ) : (
              <p className="text-sm text-smoke">The preview appears here as you write.</p>
            )}
          </div>
        )}
      </div>
      <p className="a-help">
        {value.trim().split(/\s+/).filter(Boolean).length} words. Headings, lists, links, quotes and images are supported; anything else is shown as plain text.
      </p>
      {(error || uploadError) && <p className="text-xs text-[#ff9aa6]">{error ?? uploadError}</p>}
    </div>
  );
}
