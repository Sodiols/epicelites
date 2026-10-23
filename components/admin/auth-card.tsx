import Image from "next/image";

/** Shared frame for sign-in, password reset and recovery screens. */
export function AuthCard({ title, children, notice }: { title: string; children: React.ReactNode; notice?: React.ReactNode }) {
  return (
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-4 py-12">
      {/* The safe-zone ring from the public site, static here: this screen is a gate, not a show. */}
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 size-[110vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet/15" />
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 size-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-violet/10" />

      <div className="relative w-full max-w-[25rem]">
        <div className="flex flex-col items-center text-center">
          <Image src="/images/epic-elites-mark.webp" alt="Epic Elites" width={72} height={51} priority className="h-[51px] w-[72px] object-contain" />
          <p className="mt-5 text-[0.6875rem] font-semibold tracking-[0.16em] text-smoke uppercase">Epic Elites</p>
          <h1 className="font-display mt-1 text-4xl leading-none sm:text-5xl">{title}</h1>
        </div>
        {notice && <div className="mt-6">{notice}</div>}
        <div className="a-panel mt-6 p-6 sm:p-8">{children}</div>
      </div>
    </main>
  );
}

export function Notice({ tone, children }: { tone: "info" | "error"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`border px-4 py-3 text-sm ${
        tone === "error" ? "border-[#5c2a33] bg-[#1d0f13] text-[#ff9aa6]" : "border-line bg-carbon text-smoke"
      }`}
    >
      {children}
    </p>
  );
}
