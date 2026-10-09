"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/components/AppProvider";

/** Re-validates the cart against live prices/stock once when the cart or checkout opens, and explains any change. */
export function CartNotices({ className = "" }: { className?: string }) {
  const { ready, items, syncCart, notices, clearNotices } = useApp();
  const done = useRef(false);

  useEffect(() => {
    if (ready && !done.current) {
      done.current = true;
      void syncCart(items);
    }
  }, [ready, items, syncCart]);

  if (!notices.length) return null;
  return (
    <div role="alert" className={`rounded-xl border border-gold/50 bg-gold-3 p-4 text-sm text-[#6b5120] ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">We updated your cart</p>
        <button type="button" onClick={clearNotices} className="font-semibold underline">Dismiss</button>
      </div>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {notices.map((n) => <li key={n}>{n}</li>)}
      </ul>
    </div>
  );
}
