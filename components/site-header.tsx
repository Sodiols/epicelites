"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ArrowUpRightIcon, ListIcon, XIcon } from "@phosphor-icons/react";
import { nav } from "@/lib/team";
import { useBrand } from "@/components/brand-provider";
import { easeInOutQuart, easeOutExpo, snappy } from "@/lib/motion";

export function SiteHeader() {
  const pathname = usePathname();
  const brand = useBrand();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Hide while reading downward, return the moment the visitor scrolls up.
  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setSolid(y > 24);
    setHidden(y > 160 && y > previous && !open);
  });

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const indicator = hovered ?? nav.find((n) => isActive(n.href))?.href ?? null;

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.45, ease: easeOutExpo }}
      >
        <div
          className={`transition-[background-color,border-color,backdrop-filter] duration-500 ${
            solid || open
              ? "border-b border-line/80 bg-night/80 backdrop-blur-xl"
              : "border-b border-transparent bg-transparent"
          }`}
        >
          <div className="mx-auto flex h-[4.5rem] max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-8">
            <Link href="/" className="group flex items-center gap-3" aria-label={`${brand.teamName} home`}>
              <Image
                src={brand.logoUrl}
                alt={`${brand.teamName} crest`}
                width={36}
                height={26}
                priority
                className="h-[26px] w-9 object-contain transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-rotate-6 group-hover:scale-110"
              />
              <span className="font-display text-[1.375rem] leading-none tracking-wide">
                {brand.teamName}
              </span>
            </Link>

            <nav aria-label="Main" className="hidden lg:block" onMouseLeave={() => setHovered(null)}>
              <ul className="flex items-center">
                {nav.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href} className="relative">
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onMouseEnter={() => setHovered(item.href)}
                        onFocus={() => setHovered(item.href)}
                        onBlur={() => setHovered(null)}
                        className={`relative z-10 block px-4 py-2.5 text-[0.8125rem] font-semibold tracking-[0.08em] uppercase transition-colors duration-300 ${
                          indicator === item.href ? "text-night" : active ? "text-bone" : "text-smoke hover:text-bone"
                        }`}
                        style={{ fontStretch: "112%" }}
                      >
                        {item.label}
                      </Link>
                      {indicator === item.href && (
                        <motion.span
                          layoutId="nav-indicator"
                          className="chamfer absolute inset-0 bg-violet [--cut:8px]"
                          transition={snappy}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/contact" className="btn btn-primary hidden min-h-11 sm:inline-flex">
                <span>Contact the team</span>
              </Link>
              <button
                ref={toggleRef}
                type="button"
                className="grid size-11 place-items-center border border-line text-bone transition-colors hover:border-violet lg:hidden"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-controls="mobile-menu"
                onClick={() => setOpen((v) => !v)}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={open ? "close" : "open"}
                    initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
                    transition={snappy}
                    className="grid place-items-center"
                  >
                    {open ? <XIcon size={20} /> : <ListIcon size={20} />}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-[45] flex flex-col bg-carbon px-4 pt-24 pb-8 sm:px-8 lg:hidden"
            // The panel grows out of the menu button as an expanding circle.
            initial={reduce ? { opacity: 0 } : { clipPath: "circle(0px at calc(100% - 2.6rem) 2.25rem)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "circle(150% at calc(100% - 2.6rem) 2.25rem)" }}
            exit={reduce ? { opacity: 0 } : { clipPath: "circle(0px at calc(100% - 2.6rem) 2.25rem)" }}
            transition={{ duration: 0.75, ease: easeInOutQuart }}
          >
            <nav aria-label="Mobile">
              <ul className="flex flex-col">
                {[{ href: "/", label: "Home" }, ...nav, { href: "/contact", label: "Contact" }].map(
                  (item, i) => (
                    <li key={item.href} className="overflow-hidden border-b border-line">
                      <motion.div
                        initial={{ y: "110%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "110%" }}
                        transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.18 + i * 0.05 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={pathname === item.href ? "page" : undefined}
                          className="flex items-baseline justify-between py-3 font-display text-[clamp(2.5rem,11vw,4rem)] leading-none text-bone aria-[current=page]:text-violet"
                        >
                          {item.label}
                          <ArrowUpRightIcon size={24} className="text-smoke" aria-hidden />
                        </Link>
                      </motion.div>
                    </li>
                  ),
                )}
              </ul>
            </nav>
            <motion.p
              className="mt-auto font-wide text-xs text-smoke"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Rise above
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
