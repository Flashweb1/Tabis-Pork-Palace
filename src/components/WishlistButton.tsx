"use client";

import { Icon } from "@/components/Icon";
import { useApp } from "@/components/AppProvider";

export function WishlistButton({ productId, label = false }: { productId: number; label?: boolean }) {
  const { wishlist, toggleWish } = useApp();
  const on = wishlist.has(productId);
  return (
    <button
      type="button"
      onClick={() => toggleWish(productId)}
      aria-pressed={on}
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      className={
        label
          ? `inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition ${on ? "border-gold bg-gold-3 text-[#7a5d22]" : "border-forest/20 text-forest hover:border-forest"}`
          : `grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow transition hover:scale-105 ${on ? "text-red-600" : "text-forest"}`
      }
    >
      <Icon name="heart" fill={on} className="h-[18px] w-[18px]" />
      {label && (on ? "In wishlist" : "Add to wishlist")}
    </button>
  );
}
