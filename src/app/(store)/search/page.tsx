import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ProductCard } from "@/components/ProductCard";
import { searchProducts, SEARCH_SUGGESTIONS } from "@/lib/search";
import { getAllProducts } from "@/lib/store";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const all = await getAllProducts();
  const results = q ? searchProducts(q, all) : [];
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-5xl font-semibold text-forest">{q ? `Results for “${q}”` : "Search Tabis"}</h1>
      <form action="/search" className="relative mt-6 max-w-2xl" role="search">
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-forest/50" />
        <input name="q" defaultValue={q} placeholder="Try “pork belly”, “50kg pig” or “bulk pork”" className="input !rounded-full !py-3.5 !pl-12" aria-label="Search" />
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {SEARCH_SUGGESTIONS.map((s) => (
          <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="rounded-full border border-forest/20 px-3.5 py-1.5 text-sm font-medium text-forest hover:border-forest">{s}</Link>
        ))}
      </div>
      {q && (
        <div className="mt-10">
          {results.length === 0 ? (
            <div className="card p-10 text-center">
              <h2 className="font-display text-3xl font-semibold text-forest">Nothing found for “{q}”</h2>
              <p className="mt-2 text-charcoal/70">Try a cut name like “ribs”, or browse the full shop.</p>
              <Link href="/shop" className="btn-primary mt-5">Browse all pork</Link>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-charcoal/60">{results.length} result{results.length === 1 ? "" : "s"}</p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{results.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
