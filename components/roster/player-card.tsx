"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import type { Player } from "@/lib/data/public";

type Props = {
  player: Player;
  index: number;
  /** Render as a link (home page) or a button that opens the profile (roster page). */
  href?: string;
  onOpen?: () => void;
  layoutId?: string;
  sizes?: string;
  className?: string;
};

/**
 * A roster card that physically responds to the pointer: it tilts toward the cursor
 * on a spring, a violet light follows the pointer across the surface, and the
 * portrait lifts forward on its own depth layer.
 */
export function PlayerCard({ player, index, href, onOpen, layoutId, sizes, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 180, damping: 18 });
  const lightX = useTransform(mx, (v) => `${v * 100}%`);
  const lightY = useTransform(my, (v) => `${v * 100}%`);
  const light = useMotionTemplate`radial-gradient(420px circle at ${lightX} ${lightY}, rgb(142 107 255 / 0.22), transparent 60%)`;
  const lift = useSpring(0, { stiffness: 200, damping: 20 });
  const portraitY = useTransform(lift, [0, 1], ["0%", "-3%"]);
  const portraitScale = useTransform(lift, [0, 1], [1, 1.06]);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onEnter = () => !reduce && lift.set(1);
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
    lift.set(0);
  };

  const image = player.image;
  const label = `${player.name}, ${player.role}. View profile`;

  const body = (
    <>
      <motion.span aria-hidden className="absolute inset-0 z-0" style={{ background: light }} />
      <span
        aria-hidden
        className="font-display pointer-events-none absolute top-3 right-4 z-0 text-[7rem] leading-none text-graphite transition-colors duration-500 group-hover:text-violet-deep"
      >
        {player.number}
      </span>
      <motion.span
        layoutId={layoutId}
        className={`absolute inset-x-0 bottom-0 z-10 block h-[88%] ${image?.onBlack ? "mix-blend-lighten" : ""}`}
        style={{ y: portraitY, scale: portraitScale, transformOrigin: "50% 100%" }}
      >
        {image && (
          <Image
            src={image.src}
            alt=""
            width={image.width}
            height={image.height}
            sizes={sizes ?? "(min-width: 1024px) 30vw, 80vw"}
            className="h-full w-full object-contain object-bottom"
          />
        )}
      </motion.span>
      <span aria-hidden className="absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-carbon via-carbon/70 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 p-5">
        <span className="min-w-0">
          <span className="font-display block truncate text-[2rem] leading-none">{player.name}</span>
          <span className="mt-1.5 block truncate text-sm text-smoke">{player.role}</span>
        </span>
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center border border-line text-bone transition-[background-color,border-color,color,rotate] duration-500 group-hover:rotate-45 group-hover:border-violet group-hover:bg-violet group-hover:text-night"
        >
          <ArrowUpRightIcon size={18} />
        </span>
      </span>
    </>
  );

  const shared =
    "group frame relative block aspect-[4/5] w-full overflow-hidden text-left [--cut:18px] [transform-style:preserve-3d]";

  return (
    <motion.div
      ref={ref}
      className={`[perspective:900px] ${className ?? ""}`}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      data-index={index}
    >
      <motion.div style={{ rotateX: rx, rotateY: ry }} className="will-change-transform">
        {href ? (
          <Link href={href} aria-label={label} className={shared}>
            {body}
          </Link>
        ) : (
          <button type="button" onClick={onOpen} aria-label={label} className={shared}>
            {body}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
