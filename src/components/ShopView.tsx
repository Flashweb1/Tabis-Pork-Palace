import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { SortSelect } from "@/components/SortSelect";
import { stockState, type ProductView } from "@/lib/store";

export type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const CUT_FILTERS = ["belly", "shoulder", "leg", "loin", "ribs", "chops", "tenderloin", "head", "feet", "offal", "skin", "sausage", "mince"];

export function filterProducts(all: ProductView[], sp: SP): ProductView[] {
  let list = [...all];
  const min = Number(one(sp.min)) || 0;
  const max = Number(one(sp.max)) || 0;
  if (one(sp.deals)) list = list.filter((p) => p.salePrice);
  if (min) list = list.filter((p) => (p.salePrice ?? p.price) >= min);
  if (max) list = list.filter((p) => (p.salePrice ?? p.price) <= max);
  if (one(sp.stock)) list = list.filter((p) => ["in", "low"].includes(stockState(p)));
  if (one(sp.storage)) list = list.filter((p) => p.storage === one(sp.storage));
  if (one(sp.unit)) list = list.filter((p) => p.unit === one(sp.unit));
  if (one(sp.cut)) list = list.filter((p) => p.slug.includes(one(sp.cut)) || p.name.toLowerCase().includes(one(sp.cut)));
  if (one(sp.pack)) list = list.filter((p) => p.packSize === one(sp.pack));
  const sort = one(sp.sort) || "featured";
  const price = (p: ProductView) => p.salePrice ?? p.price;
  list.sort((a, b) => {
    switch (sort) {
      case "newest": return b.id - a.id;
      case "price-asc": return price(a) - price(b);
      case "price-desc": return price(b) - price(a);
      case "best": return b.soldCount - a.soldCount;
      default: return Number(b.featured) - Number(a.featured) || b.soldCount - a.soldCount;
    }
  });
  return list;
}

export function ShopView({
  products,
  allInScope,
  categories,
  sp,
  basePath,
  activeCategory,
  title,
  intro,
}: {
  products: ProductView[];
  allInScope: ProductView[];
  categories: { slug: string; name: string }[];
  sp: SP;
  basePath: string;
  activeCategory?: string;
  title: string;
  intro?: string;
}) {
  const packs = Array.from(new Set(allInScope.map((p) => p.packSize).filter(Boolean))) as string[];
  const field = "input !py-2";
  const catHref = (slug: string) => (slug === "whole-pigs" ? "/whole-pigs" : `/category/${slug}`);
  return (
    <div className="container-x py-10">
      <header className="mb-8">
        <p className="eyebrow mb-2">Shop</p>
        <h1 className="font-display text-5xl font-semibold text-forest sm:text-6xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-charcoal/70">{intro}</p>}
      </header>

      <div className="mb-6 no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href="/shop" className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${!activeCategory && !one(sp.deals) ? "border-forest bg-forest text-ivory" : "border-forest/20 text-forest hover:border-forest"}`}>All Pork</Link>
        {categories.map((c) => (
          <Link key={c.slug} href={catHref(c.slug)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${activeCategory === c.slug ? "border-forest bg-forest text-ivory" : "border-forest/20 text-forest hover:border-forest"}`}>{c.name}</Link>
        ))}
        <Link href="/shop?deals=1" className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${one(sp.deals) ? "border-gold bg-gold text-white" : "border-gold/50 text-gold hover:bg-gold-3"}`}>Special Offers</Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <details className="card group p-5 lg:!block" open>
            <summary className="flex cursor-pointer list-none items-center justify-between font-display text-2xl font-semibold text-forest lg:pointer-events-none">
              Filters <span className="text-sm font-sans text-gold group-open:hidden lg:hidden">Show</span>
            </summary>
            <form action={basePath} method="get" className="mt-4 space-y-4">
              {one(sp.deals) && <input type="hidden" name="deals" value="1" />}
              {one(sp.sort) && <input type="hidden" name="sort" value={one(sp.sort)} />}
              <div>
                <span className="label">Price (₦)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input name="min" type="number" min={0} placeholder="Min" defaultValue={one(sp.min)} className={field} aria-label="Minimum price" />
                  <input name="max" type="number" min={0} placeholder="Max" defaultValue={one(sp.max)} className={field} aria-label="Maximum price" />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="f-cut">Cut</label>
                <select id="f-cut" name="cut" defaultValue={one(sp.cut)} className={field}>
                  <option value="">Any cut</option>
                  {CUT_FILTERS.map((c) => <option key={c} value={c} className="capitalize">{c[0].toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="f-unit">Sold by</label>
                <select id="f-unit" name="unit" defaultValue={one(sp.unit)} className={field}>
                  <option value="">Weight, pack or pig</option>
                  <option value="kg">Per kg</option>
                  <option value="pack">Per pack</option>
                  <option value="pig">Per whole pig</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="f-storage">Fresh / Frozen</label>
                <select id="f-storage" name="storage" defaultValue={one(sp.storage)} className={field}>
                  <option value="">Fresh &amp; frozen</option>
                  <option value="fresh">Fresh</option>
                  <option value="frozen">Frozen</option>
                </select>
              </div>
              {packs.length > 0 && (
                <div>
                  <label className="label" htmlFor="f-pack">Pack size</label>
                  <select id="f-pack" name="pack" defaultValue={one(sp.pack)} className={field}>
                    <option value="">Any size</option>
                    {packs.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm font-medium text-charcoal/80">
                <input type="checkbox" name="stock" value="1" defaultChecked={!!one(sp.stock)} className="h-4 w-4 accent-[#123D27]" /> In stock only
              </label>
              <div className="flex gap-2">
                <button className="btn-primary btn-sm flex-1">Apply</button>
                <Link href={basePath} className="btn-outline btn-sm">Reset</Link>
              </div>
            </form>
          </details>
        </aside>

        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-charcoal/60">{products.length} product{products.length === 1 ? "" : "s"}</p>
            <SortSelect value={one(sp.sort) || "featured"} />
          </div>
          {products.length === 0 ? (
            <div className="card p-10 text-center">
              <h2 className="font-display text-3xl font-semibold text-forest">No products match those filters</h2>
              <p className="mt-2 text-charcoal/70">Try resetting your filters, or chat with us for custom requests.</p>
              <Link href={basePath} className="btn-primary mt-5">Reset filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
