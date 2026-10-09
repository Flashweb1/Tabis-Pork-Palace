"use client";

import Link from "next/link";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-x grid min-h-[50vh] place-items-center py-16 text-center">
      <div>
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-2 font-display text-5xl font-semibold text-forest">We hit a snag</h1>
        <p className="mt-3 text-charcoal/65">Please try again. If it keeps happening, message us on WhatsApp and we&apos;ll sort it out.</p>
        {error.digest && <p className="mt-2 text-xs text-charcoal/40">Reference: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href="/" className="btn-outline">Go home</Link>
        </div>
      </div>
    </div>
  );
}
