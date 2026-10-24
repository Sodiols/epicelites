"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from "@phosphor-icons/react";
import { PlayerCard } from "@/components/roster/player-card";
import { easeOutExpo, heavy, snappy } from "@/lib/motion";
import { pad } from "@/lib/team";
import type { Player } from "@/lib/data/public";

const matches = (p: Player, key: string | null) => key !== null && (p.slug === key || p.legacyKey === key);

/**
 * The roster grid sits in three staggered columns. Opening a card morphs its portrait
 * into the profile view (a shared-element transition), and the open profile lives in
 * the URL as ?player=<slug> so it can be linked, refreshed and navigated with Back.
 * Links from the original site (?player=03) still resolve through each player's legacy key,
 * so renumbering a jersey never breaks a profile link.
 */
export function RosterGrid({ players, teamName, game }: { players: Player[]; teamName: string; game: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const fromUrl = players.findIndex((p) => matches(p, params.get("player")));
  const [openIndex, setOpenIndex] = useState<number | null>(fromUrl >= 0 ? fromUrl : null);
  const [origin, setOrigin] = useState<number | null>(fromUrl >= 0 ? fromUrl : null);
  const [direction, setDirection] = useState(1);
  const [mounted, setMounted] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Keep component state in step with Back/Forward navigation.
  useEffect(() => {
    const i = players.findIndex((p) => matches(p, params.get("player")));
    setOpenIndex(i >= 0 ? i : null);
  }, [params, players]);

  const syncUrl = useCallback(
    (i: number | null) => {
      const url = i === null ? pathname : `${pathname}?player=${players[i].slug}`;
      router.replace(url, { scroll: false });
    },
    [pathname, router, players],
  );

  const open = (i: number) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setOrigin(i);
    setOpenIndex(i);
    syncUrl(i);
  };

  const close = useCallback(() => {
    setOpenIndex(null);
    syncUrl(null);
    requestAnimationFrame(() => returnFocus.current?.focus());
  }, [syncUrl]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (openIndex === null) return;
      const next = (openIndex + dir + players.length) % players.length;
      setDirection(dir);
      setOpenIndex(next);
      syncUrl(next);
    },
    [openIndex, syncUrl, players.length],
  );

  return (
    <LayoutGroup>
      <ul className="mx-auto mt-16 grid max-w-[1400px] gap-6 px-4 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 lg:gap-8">
        {players.map((p, i) => (
          <motion.li
            key={p.id}
            // The middle column sits lower, so the grid reads as a staggered formation.
            className={i % 3 === 1 ? "lg:translate-y-24" : ""}
            initial={{ opacity: 0, y: 80, rotateX: 18 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ ...heavy, delay: (i % 3) * 0.08 }}
            style={{ transformPerspective: 1000 }}
          >
            <PlayerCard
              player={p}
              index={i}
              onOpen={() => open(i)}
              layoutId={`portrait-${i}`}
            />
          </motion.li>
        ))}
      </ul>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {openIndex !== null && (
              <PlayerDialog
                key="dialog"
                players={players}
                teamName={teamName}
                game={game}
                index={openIndex}
                originIndex={origin}
                direction={direction}
                onClose={close}
                onStep={step}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </LayoutGroup>
  );
}

function PlayerDialog({
  players,
  teamName,
  game,
  index,
  originIndex,
  direction,
  onClose,
  onStep,
}: {
  players: Player[];
  teamName: string;
  game: string;
  index: number;
  originIndex: number | null;
  direction: number;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const p = players[index];
  const image = p.image;

  useEffect(() => {
    closeRef.current?.focus();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowRight") onStep(1);
    if (e.key === "ArrowLeft") onStep(-1);
    if (e.key === "Tab" && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll<HTMLElement>("button");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-name"
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain"
      onKeyDown={onKeyDown}
    >
      <motion.button
        type="button"
        aria-label="Close profile"
        tabIndex={-1}
        className="fixed inset-0 bg-night/85 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className="relative mx-auto grid min-h-full max-w-[1400px] items-center gap-8 px-4 py-20 sm:px-8 md:grid-cols-2 md:gap-14"
      >
        {/* Portrait: morphs out of the card that was clicked, then slides between players. */}
        <motion.div
          layoutId={originIndex !== null ? `portrait-${originIndex}` : undefined}
          className="relative aspect-[4/5] w-full overflow-hidden bg-carbon chamfer [--cut:28px]"
          transition={heavy}
        >
          <span
            aria-hidden
            className="font-display absolute -top-4 right-2 text-[15rem] leading-none text-graphite"
          >
            {p.number}
          </span>
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={p.id}
              custom={direction}
              className={`absolute inset-0 ${image?.onBlack ? "mix-blend-lighten" : ""}`}
              variants={{
                enter: (d: number) => ({ x: `${d * 60}%`, opacity: 0, rotate: d * 4 }),
                center: { x: "0%", opacity: 1, rotate: 0 },
                exit: (d: number) => ({ x: `${d * -60}%`, opacity: 0, rotate: d * -4 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={heavy}
            >
              {image && (
                <Image
                  src={image.src}
                  alt={`Portrait of ${p.name}`}
                  width={image.width}
                  height={image.height}
                  sizes="(min-width: 768px) 45vw, 90vw"
                  quality={90}
                  className="absolute inset-x-0 bottom-0 h-[92%] w-full object-contain object-bottom"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.1 }}
        >
          <p className="font-mono text-sm text-smoke tabular-nums">
            {pad(index + 1)} / {pad(players.length)}
          </p>
          <div className="mt-3 overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
              <motion.h2
                id="profile-name"
                key={p.id}
                className="font-display text-[clamp(3.5rem,8vw,7rem)] leading-[0.85]"
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.6, ease: easeOutExpo }}
              >
                {p.name}
              </motion.h2>
            </AnimatePresence>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-line py-5 sm:grid-cols-3">
            {(
              [
                ["Team", teamName],
                ["Game", game],
                ["Role", p.role],
                ["In-game name", p.inGameName],
                ["Number", p.number],
                ["Region", p.region],
              ] as const
            )
              .filter(([, v]) => Boolean(v))
              .map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs font-semibold text-smoke uppercase">{k}</dt>
                <dd className="mt-1.5 text-sm font-medium break-words">{v}</dd>
              </div>
            ))}
          </dl>

          {p.bio && <p className="mt-6 max-w-[48ch] text-lg text-smoke">{p.bio}</p>}
          {p.socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {p.socials.map((link) => (
                <li key={link.network}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-sm font-semibold capitalize text-violet"
                  >
                    {link.network}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-ghost [--btn-bg:var(--color-night)]" onClick={() => onStep(-1)}>
              <ArrowLeftIcon size={16} aria-hidden />
              Previous
            </button>
            <button type="button" className="btn btn-ghost [--btn-bg:var(--color-night)]" onClick={() => onStep(1)}>
              Next player
              <ArrowRightIcon size={16} aria-hidden />
            </button>
          </div>
        </motion.div>

        <motion.button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className="fixed top-4 right-4 grid size-12 place-items-center border border-line bg-night text-bone transition-colors hover:border-violet hover:text-violet sm:top-6 sm:right-8"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={snappy}
        >
          <XIcon size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
}
