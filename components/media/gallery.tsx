"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowLeftIcon, ArrowRightIcon, PlayIcon, XIcon } from "@phosphor-icons/react";
import { heavy, snappy } from "@/lib/motion";
import type { MediaItem } from "@/lib/data/public";
import { youTubeId } from "@/lib/video";

type Tile = {
  id: string;
  kind: "image" | "video";
  src: string;
  width: number;
  height: number;
  onBlack: boolean;
  caption: string;
  alt: string;
  videoId: string | null;
  tournament: boolean;
};

function toTile(item: MediaItem): Tile | null {
  const caption = item.caption || item.title || "";
  if (item.kind === "video") {
    const id = item.video_url ? youTubeId(item.video_url) : null;
    if (!id) return null;
    return {
      id: item.id,
      kind: "video",
      // A custom poster wins; otherwise YouTube's own thumbnail.
      src: item.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      width: item.width ?? 480,
      height: item.height ?? 360,
      onBlack: false,
      caption,
      alt: item.alt_text || caption || "Video",
      videoId: id,
      tournament: item.category === "tournament",
    };
  }
  if (!item.url) return null;
  return {
    id: item.id,
    kind: "image",
    src: item.url,
    width: item.width ?? 1200,
    height: item.height ?? 1200,
    onBlack: item.on_black,
    caption,
    alt: item.alt_text || caption,
    videoId: null,
    tournament: item.category === "tournament",
  };
}

/**
 * Masonry gallery. Opening an item grows it out of its tile into the viewer
 * (shared-element transition) and closing sends it back to exactly where it came from.
 */
export function Gallery({ items }: { items: MediaItem[] }) {
  const all = items.map(toTile).filter((t): t is Tile => t !== null);
  const [filter, setFilter] = useState<"all" | "tournament" | "video">("all");
  const tiles = all.filter((tile) => filter === "all" || (filter === "video" ? tile.kind === "video" : tile.tournament && tile.kind === "image"));
  const [active, setActive] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setActive(null);
  }, []);

  if (all.length === 0) {
    return <p className="text-lg text-smoke">New photos and videos will appear here as the team publishes them.</p>;
  }

  return (
    <LayoutGroup>
      <div aria-label="Filter gallery" role="group" className="mb-8 flex flex-wrap gap-2">
        {([
          ["all", "All media"],
          ["tournament", "Tournament photos"],
          ["video", "Videos"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            className={`btn ${filter === value ? "btn-primary" : "btn-ghost"}`}
            onClick={() => {
              setActive(null);
              setFilter(value);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {tiles.length === 0 && <p role="status" className="text-smoke">No {filter === "video" ? "videos" : "tournament photos"} published yet.</p>}
      <ul className="columns-1 gap-6 sm:columns-2 lg:columns-3">
        {tiles.map((item, i) => (
          <motion.li
            key={item.id}
            className="mb-6 break-inside-avoid"
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...heavy, delay: (i % 3) * 0.07 }}
          >
            <button
              type="button"
              className="group block w-full text-left"
              aria-label={`${item.kind === "video" ? "Play video" : "View larger"}: ${item.caption || item.alt}`}
              aria-haspopup="dialog"
              onClick={() => setActive(i)}
            >
              <motion.span
                layoutId={`media-${item.id}`}
                transition={heavy}
                className="chamfer relative block overflow-hidden bg-carbon [--cut:20px]"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                  className={`h-auto w-full transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04] ${item.onBlack ? "mix-blend-lighten" : ""}`}
                />
                {item.kind === "video" && (
                  <span
                    aria-hidden
                    className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center bg-violet text-night transition-transform duration-500 group-hover:scale-110"
                  >
                    <PlayIcon size={26} weight="fill" />
                  </span>
                )}
              </motion.span>
              {item.caption && (
                <span className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-medium">{item.caption}</span>
                  <ArrowRightIcon
                    size={14}
                    aria-hidden
                    className="-translate-x-2 text-violet opacity-0 transition-[opacity,translate] duration-500 group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </span>
              )}
            </button>
          </motion.li>
        ))}
      </ul>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {active !== null && tiles[active] && (
              <Lightbox tiles={tiles} index={active} onClose={close} onChange={setActive} />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </LayoutGroup>
  );
}

function Lightbox({
  tiles,
  index,
  onClose,
  onChange,
}: {
  tiles: Tile[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const item = tiles[index];
  const canBrowse = tiles.length > 1;
  const go = (d: number) => {
    if (canBrowse) onChange((index + d + tiles.length) % tiles.length);
  };
  const label = item.caption || item.alt;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.documentElement.style.overflow;
    dialog?.showModal();
    closeRef.current?.focus();
    document.documentElement.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.documentElement.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      className="fixed inset-0 m-0 grid h-dvh max-h-none w-screen max-w-none place-items-center overscroll-contain bg-transparent p-4 text-bone sm:p-10"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      <motion.button
        type="button"
        tabIndex={-1}
        aria-label="Close viewer"
        className="absolute inset-0 bg-night/92 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.figure
        layoutId={`media-${item.id}`}
        transition={heavy}
        className="chamfer relative z-10 overflow-hidden bg-carbon [--cut:28px]"
        style={
          item.kind === "video"
            ? { aspectRatio: "16 / 9", width: "min(92vw, calc(76dvh * 16 / 9))" }
            : { aspectRatio: `${item.width} / ${item.height}`, width: `min(92vw, calc(76dvh * ${item.width / item.height}))` }
        }
      >
        {item.kind === "video" && item.videoId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&rel=0`}
            title={label}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <Image
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            sizes="90vw"
            className={`h-full w-full object-contain ${item.onBlack ? "mix-blend-lighten" : ""}`}
          />
        )}
      </motion.figure>

      <motion.div
        className={`relative z-10 mt-4 flex w-full max-w-xl items-center gap-4 ${canBrowse ? "justify-between" : "justify-center"}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={snappy}
      >
        {canBrowse && <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous item"
          className="grid size-11 place-items-center border border-line bg-night transition-colors hover:border-violet hover:text-violet"
        >
          <ArrowLeftIcon size={18} />
        </button>}
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-medium">{label}</p>
          {item.videoId && (
            <a className="link-underline text-sm text-violet" href={`https://www.youtube.com/watch?v=${item.videoId}`} target="_blank" rel="noopener noreferrer">
              Watch on YouTube
            </a>
          )}
        </div>
        {canBrowse && <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next item"
          className="grid size-11 place-items-center border border-line bg-night transition-colors hover:border-violet hover:text-violet"
        >
          <ArrowRightIcon size={18} />
        </button>}
      </motion.div>

      <motion.button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close viewer"
        className="fixed top-4 right-4 z-10 grid size-12 place-items-center border border-line bg-night transition-colors hover:border-violet hover:text-violet sm:top-6 sm:right-8"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 90 }}
        transition={snappy}
      >
        <XIcon size={20} />
      </motion.button>
    </dialog>
  );
}
