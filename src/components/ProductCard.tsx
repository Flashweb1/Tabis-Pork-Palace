import Link from "next/link";
import { AddToCart } from "@/components/AddToCart";
import { Img } from "@/components/Img";
import { Stars, StockBadge } from "@/components/ui";
import { WishlistButton } from "@/components/WishlistButton";
import { naira } from "@/lib/format";
import { pigRangeLabel, stockState, type ProductView } from "@/lib/store";

export function ProductCard({ p }: { p: ProductView }) {
  const state = stockState(p);
  const unitText = p.productType === "whole_pig" ? "/ pig" : p.unit === "kg" ? "/ kg" : p.unit === "pack" ? "/ pack" : "";
  const quote = p.productType === "quote_required";
  return (
    <article className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(18,61,39,0.25)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-forest-3">
        <Link href={`/product/${p.slug}`} aria-label={p.name}>
          <Img src={p.image} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="badge bg-white/95 text-forest capitalize shadow-sm">{p.storage}</span>
          {p.salePrice && <span className="badge bg-gold text-white shadow-sm">Sale</span>}
          {p.productType === "bulk" && <span className="badge bg-forest text-ivory shadow-sm">Bulk</span>}
        </div>
        <div className="absolute right-3 top-3">
          <WishlistButton productId={p.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{p.categoryName}</p>
        <h3 className="mt-1 font-display text-[1.45rem] font-semibold leading-tight text-forest">
          <Link href={`/product/${p.slug}`} className="hover:underline">
            {p.name}
          </Link>
        </h3>
        {p.productType === "whole_pig" && <p className="mt-1 text-sm text-charcoal/60">Estimated weight {pigRangeLabel(p.pigRange)}</p>}
        <div className="mt-2 flex items-center gap-2">
          {p.reviewCount > 0 && (
            <>
              <Stars rating={p.rating} size="h-3.5 w-3.5" />
              <span className="text-xs text-charcoal/60">({p.reviewCount})</span>
            </>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            {quote ? (
              <span className="font-display text-2xl font-semibold text-forest">Request Quote</span>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[1.7rem] font-semibold leading-none text-forest">{naira(p.salePrice ?? p.price)}</span>
                <span className="text-sm text-charcoal/60">{unitText}</span>
                {p.salePrice && <span className="text-sm text-charcoal/40 line-through">{naira(p.price)}</span>}
              </div>
            )}
          </div>
          <StockBadge state={state} stock={p.stock} unit={p.unit} />
        </div>
        <div className="mt-4 flex-1" />
        <AddToCart
          product={{
            id: p.id, slug: p.slug, name: p.name, image: p.image, unit: p.unit, productType: p.productType, price: p.price,
            salePrice: p.salePrice, minOrder: p.minOrder, maxOrder: p.maxOrder, stock: p.stock, available: p.available,
          }}
        />
      </div>
    </article>
  );
}
