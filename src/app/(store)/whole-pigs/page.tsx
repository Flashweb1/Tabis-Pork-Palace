import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/ui";
import { WholePigBuilder, type PigProduct } from "@/components/WholePigBuilder";
import { getAllProducts, pigRangeLabel } from "@/lib/store";

export const metadata: Metadata = {
  title: "Whole Pigs for Sale in Nigeria",
  description: "Buy a whole pig by weight range (20kg to 100kg+). Choose preparation — whole, cleaned, dressed or custom cut — and delivery. Final weight confirmed before fulfilment.",
};

export default async function WholePigsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const all = await getAllProducts();
  const pigs: PigProduct[] = all
    .filter((p) => p.productType === "whole_pig" || (p.categorySlug === "whole-pigs" && p.productType === "quote_required"))
    .sort((a, b) => parseInt(a.pigRange ?? "0") - parseInt(b.pigRange ?? "0"))
    .map((p) => ({
      id: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price, salePrice: p.salePrice, range: p.pigRange ?? "",
      label: pigRangeLabel(p.pigRange), stock: p.stock, available: p.available, minOrder: p.minOrder, maxOrder: p.maxOrder,
      quote: p.productType === "quote_required",
    }));
  const initial = pigs.find((p) => p.range === range)?.slug;
  return (
    <>
      <PageHero
        eyebrow="Whole pigs"
        title={<>Need more pork? <span className="text-gold-2">Go whole.</span></>}
        sub="Weddings, festive tables, restaurants and big family gatherings. Pick an estimated weight, choose how it's prepared and how it reaches you."
        image="https://images.pexels.com/photos/29841945/pexels-photo-29841945.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600"
      >
        <a href="#configure" className="btn-gold">Choose your pig</a>
        <Link href="/quote?product=whole-pig-100kg-plus" className="btn-ghost-light">Request a 100kg+ quote</Link>
      </PageHero>

      <section className="container-x py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["scale", "Estimated, then confirmed", "We show an estimated weight range. Our team confirms the final weight and price before fulfilment."],
            ["clipboard", "Prepared your way", "Whole, cleaned, dressed or custom cut — tell us exactly how you want it."],
            ["truck", "Pickup or delivery", "Collect from our facility, or have it delivered locally or on a scheduled date."],
          ].map(([i, t, d]) => (
            <div key={t} className="flex gap-4 rounded-xl border border-forest/10 bg-white p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest text-gold-2"><Icon name={i} /></span>
              <div><h3 className="font-display text-2xl font-semibold text-forest">{t}</h3><p className="mt-1 text-sm text-charcoal/70">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="configure" className="container-x scroll-mt-28 pb-8">
        <h2 className="h-section mb-8">Build your order</h2>
        {pigs.length > 0 && <WholePigBuilder pigs={pigs} initialSlug={initial} />}
      </section>
    </>
  );
}
