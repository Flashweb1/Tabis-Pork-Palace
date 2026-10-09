import type { Metadata } from "next";
import Link from "next/link";
import { Img } from "@/components/Img";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "From Farm to Table — Our Sourcing", description: "How Tabis sources, inspects, processes, quality-checks, packages and delivers premium pork." };

const STEPS = [
  ["Sourcing", "We work with trusted farms that raise healthy, well-fed pigs in clean conditions. Every supplier is vetted and visited.", "https://images.pexels.com/photos/27167732/pexels-photo-27167732.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=1000"],
  ["Inspection", "Animals are checked for health before processing and records are kept for each batch.", "https://images.pexels.com/photos/13590647/pexels-photo-13590647.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=1000"],
  ["Processing", "Hygienic, professional processing by trained butchers, chilled immediately to lock in freshness.", "https://images.pexels.com/photos/31647676/pexels-photo-31647676.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=1000"],
  ["Quality control", "Every cut is trimmed, graded and checked for colour, smell and texture before it goes any further.", "https://images.pexels.com/photos/7163985/pexels-photo-7163985.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=1000"],
  ["Packaging", "Weighed to the gram, vacuum or tray-sealed and labelled with cut, weight and date.", "https://images.pexels.com/photos/5774154/pexels-photo-5774154.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=1000"],
  ["Delivery", "Insulated cold boxes and scheduled dispatch get your order to you chilled and on time.", "https://images.pexels.com/photos/5500663/pexels-photo-5500663.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=1000"],
];

export default function FarmPage() {
  return (
    <>
      <PageHero eyebrow="Our sourcing" title="From farm to table" sub="Sourcing → Inspection → Processing → Quality Control → Packaging → Delivery. Every step is deliberate." image="https://images.pexels.com/photos/27167732/pexels-photo-27167732.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" />
      <section className="container-x py-16">
        <ol className="space-y-12">
          {STEPS.map(([t, d, img], i) => (
            <li key={t} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`}>
              <div className="aspect-[10/7] overflow-hidden rounded-2xl bg-forest-3"><Img src={img} alt={t} className="h-full w-full object-cover" /></div>
              <div><span className="font-display text-7xl font-semibold text-gold/40">0{i + 1}</span><h2 className="font-display text-4xl font-semibold text-forest">{t}</h2><div className="gold-rule my-4" /><p className="text-lg leading-relaxed text-charcoal/75">{d}</p></div>
            </li>
          ))}
        </ol>
        <p className="mt-12 rounded-xl bg-gold-3 p-5 text-sm text-[#6b5120]">Photography shown is illustrative. We&apos;re adding real Tabis farm and facility photography soon.</p>
        <div className="mt-8"><Link href="/shop" className="btn-primary">Shop fresh pork</Link></div>
      </section>
    </>
  );
}
