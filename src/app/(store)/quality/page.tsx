import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Quality & Freshness" };

export default function QualityPage() {
  return (
    <>
      <PageHero eyebrow="Quality & freshness" title="Quality you can see. Freshness you can trust." sub="How we protect the quality of every cut, from first inspection to your kitchen." />
      <section className="container-x py-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            ["shield", "Carefully sourced", "Healthy animals from vetted farms, with batch records."],
            ["snow", "Cold chain handling", "Chilled promptly after processing and held between 0°C and 4°C until dispatch."],
            ["scale", "Accurate weights", "Weighed on calibrated scales. Estimated-weight items are always labelled and confirmed before fulfilment."],
            ["truck", "Protected in transit", "Insulated packaging and scheduled delivery so your order arrives cold."],
          ].map(([i, t, d]) => (
            <div key={t} className="card flex gap-4 p-6"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-forest text-gold-2"><Icon name={i} className="h-6 w-6" /></span><div><h2 className="font-display text-3xl font-semibold text-forest">{t}</h2><p className="mt-1 text-charcoal/70">{d}</p></div></div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl bg-forest p-8 text-ivory">
          <h2 className="font-display text-4xl font-semibold">Storing your pork</h2>
          <ul className="mt-4 grid gap-3 text-ivory/85 sm:grid-cols-3"><li>Refrigerate fresh pork immediately at 0–4°C and cook within 2 days.</li><li>Freeze in portions to keep it for up to 6 months.</li><li>Thaw in the fridge, never on the counter. Cook to 63°C internal temperature.</li></ul>
        </div>
        <div className="mt-8 flex gap-3"><Link href="/shop" className="btn-primary">Shop now</Link><Link href="/pork-guide" className="btn-outline">Pork guide</Link></div>
      </section>
    </>
  );
}
