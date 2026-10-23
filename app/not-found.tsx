import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";

export default function NotFound() {
  return (
    <main id="main" className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-4">
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 size-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet/50"
      />
      <div className="relative text-center">
        <p className="font-mono text-sm text-smoke">404</p>
        <h1 className="font-display mt-4 text-[clamp(4rem,14vw,11rem)] leading-[0.8]">
          Outside <span className="text-violet">the zone</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[36ch] text-lg text-smoke">
          This page does not exist or has moved. Head back to the home page.
        </p>
        <Link href="/" className="btn btn-primary mt-8">
          <ArrowLeftIcon size={16} weight="bold" aria-hidden />
          Back to home
        </Link>
      </div>
    </main>
  );
}
