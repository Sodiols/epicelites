"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { HandGrabbingIcon } from "@phosphor-icons/react";
import { heavy } from "@/lib/motion";

/**
 * A jersey you can actually turn. Drag (or swipe) to spin it; let go and it carries
 * your throw velocity, then settles on whichever side is nearest with a weighted spring.
 * Arrow keys and the Front/Back buttons drive the same rotation.
 */
export function JerseyViewer({
  front,
  back,
  edition,
}: {
  front: string;
  back: string;
  edition: string | null;
}) {
  const reduce = useReducedMotion();
  const rotateY = useMotionValue(0);
  const drag = useRef<{ startX: number; startRot: number; lastX: number; lastT: number; v: number } | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");

  useMotionValueEvent(rotateY, "change", (v) => {
    const norm = ((v % 360) + 360) % 360;
    setSide(norm > 90 && norm < 270 ? "back" : "front");
  });

  // Shading and sheen follow the angle, so the cloth catches light as it turns.
  const shade = useTransform(rotateY, (v) => Math.abs(Math.sin((v * Math.PI) / 180)) * 0.55);
  const sheen = useTransform(rotateY, (v) => `${((((v % 180) + 180) % 180) / 180) * 500 - 150}%`);
  const shadowScale = useTransform(rotateY, (v) => 1 - Math.abs(Math.sin((v * Math.PI) / 180)) * 0.35);

  const settle = (velocity = 0) => {
    // Project where the throw would land (one face at most per throw), then snap to the nearest face.
    const projected = rotateY.get() + Math.max(-150, Math.min(150, velocity * 0.18));
    const target = Math.round(projected / 180) * 180;
    animate(rotateY, target, reduce ? { duration: 0 } : { ...heavy, velocity });
  };

  const turnTo = (s: "front" | "back") => {
    const cur = rotateY.get();
    const base = Math.round(cur / 360) * 360;
    const candidates = s === "front" ? [base - 360, base, base + 360] : [base - 180, base + 180];
    const target = candidates.reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a));
    animate(rotateY, target, reduce ? { duration: 0 } : heavy);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    rotateY.stop();
    drag.current = { startX: e.clientX, startRot: rotateY.get(), lastX: e.clientX, lastT: e.timeStamp, v: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.v = ((e.clientX - d.lastX) / dt) * 1000 * 0.45;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    rotateY.set(d.startRot + (e.clientX - d.startX) * 0.45);
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    settle(d?.v ?? 0);
  };

  return (
    <div className="grid items-center gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div
          role="slider"
          tabIndex={0}
          aria-label="Rotate the jersey"
          aria-valuetext={side === "front" ? "Front view" : "Back view"}
          aria-valuenow={side === "front" ? 0 : 180}
          aria-valuemin={0}
          aria-valuemax={360}
          className="relative mx-auto flex aspect-[4/5] max-h-[78dvh] cursor-grab touch-pan-y items-center justify-center select-none [perspective:1600px] active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              animate(rotateY, rotateY.get() + (e.key === "ArrowRight" ? 180 : -180), reduce ? { duration: 0 } : heavy);
            }
          }}
        >
          <motion.div
            aria-hidden
            className="absolute bottom-[3%] h-6 w-1/2 rounded-[50%] bg-violet/25 blur-xl"
            style={{ scaleX: shadowScale }}
          />
          <motion.div className="relative h-[92%] aspect-[1000/1106] [transform-style:preserve-3d]" style={{ rotateY }}>
            {[
              { src: front, alt: "Epic Elites jersey, front", back: false },
              { src: back, alt: "Epic Elites jersey, back", back: true },
            ].map((f) => (
              <div
                key={f.back ? "back" : "front"}
                className="chamfer absolute inset-0 overflow-hidden [--cut:32px] [backface-visibility:hidden]"
                style={{ transform: f.back ? "rotateY(180deg)" : undefined }}
              >
                <Image src={f.src} alt={f.alt} fill draggable={false} sizes="(min-width: 1024px) 40vw, 85vw" className="object-cover" />
                <motion.span aria-hidden className="absolute inset-0 bg-night" style={{ opacity: shade }} />
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/12 to-transparent"
                  style={{ x: sheen }}
                />
              </div>
            ))}
          </motion.div>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-smoke">
          <HandGrabbingIcon size={18} aria-hidden />
          Drag to turn, or use the arrow keys
        </p>
      </div>

      <div className="lg:col-span-5">
        {edition && <p className="text-sm font-semibold text-violet">{edition}</p>}
        <h2 className="font-display text-[clamp(3rem,6vw,5.5rem)] leading-[0.86]">The match jersey</h2>
        <p className="mt-5 max-w-[40ch] text-lg text-smoke">
          Black body, violet piping and angular panels. The winged crest sits over the heart; the player tag and
          number run across the back.
        </p>
        <div className="mt-8 flex gap-3" role="group" aria-label="Choose a side">
          {(["front", "back"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={side === s}
              onClick={() => turnTo(s)}
              className={`btn ${side === s ? "btn-primary" : "btn-ghost"} min-w-32`}
            >
              {s === "front" ? "Front" : "Back"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
