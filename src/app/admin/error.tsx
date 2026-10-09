"use client";

import Link from "next/link";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <h1 className="font-display text-4xl font-semibold text-forest">This page couldn&apos;t load</h1>
      <p className="mt-2 text-sm text-charcoal/65">Something went wrong while loading this admin section. Your data is safe.</p>
      {error.digest && <p className="mt-2 text-xs text-charcoal/40">Reference: {error.digest}</p>}
      <div className="mt-5 flex justify-center gap-3">
        <button onClick={reset} className="btn-primary btn-sm">Try again</button>
        <Link href="/admin" className="btn-outline btn-sm">Dashboard</Link>
      </div>
    </div>
  );
}
