"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { XIcon } from "@phosphor-icons/react";

export function ResultImage({ src, eventName }: { src: string; eventName: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={`Enlarge result image for ${eventName}`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="relative aspect-[16/10] w-24 shrink-0 cursor-zoom-in sm:w-36"
      >
        <span className="chamfer absolute inset-0 overflow-hidden bg-carbon [--cut:10px]">
          <Image
            src={src}
            alt={`${eventName} result`}
            fill
            sizes="(min-width: 640px) 144px, 96px"
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
          />
        </span>
      </button>
      <dialog
        ref={dialogRef}
        aria-label={`${eventName} result image`}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-4 text-bone backdrop:bg-night/95 sm:p-8"
      >
        {open && (
          <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
            <div className="flex shrink-0 items-center justify-between gap-4">
              <span className="truncate text-sm font-semibold">{eventName}</span>
              <button
                type="button"
                aria-label="Close image preview"
                autoFocus
                onClick={() => dialogRef.current?.close()}
                className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 px-3 text-sm font-semibold hover:text-violet"
              >
                Close <XIcon size={20} aria-hidden />
              </button>
            </div>
            <div className="pointer-events-none relative min-h-0 flex-1">
              <Image
                src={src}
                alt={`${eventName} result`}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
