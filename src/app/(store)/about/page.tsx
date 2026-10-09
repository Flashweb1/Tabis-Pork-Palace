import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "About Tabis Pork Palace", description: "Tabis Pork Palace is a premium pork brand serving families, restaurants and businesses across Nigeria." };

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About us" title="A premium pork brand, built on trust" sub="Tabis Pork Palace brings the care of a fine butcher and the convenience of modern online shopping to Nigerian homes and businesses." image="https://images.pexels.com/photos/7163990/pexels-photo-7163990.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600" />
      <section className="container-x grid gap-12 py-16 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div className="grid place-items-center rounded-2xl bg-white p-12 paper"><LogoMark className="h-64 w-auto" /></div>
        <div className="prose-tp">
          <p className="eyebrow !mb-3">Our story</p>
          <h2 className="!mt-0">Quality you can see. Freshness you can trust.</h2>
          <p>Tabis began with a simple belief: buying pork should feel as trustworthy as it tastes. Too often, customers cannot see where their meat comes from, how it was handled, or whether the weight is honest.</p>
          <p>So we built Tabis Pork Palace around transparency — carefully sourced pigs, professional processing, accurate weights, and chilled delivery — and made it easy to order everything from half a kilo of ribs to a whole pig for the wedding of the year.</p>
          <p>Our logo says it all: a pig in profile, woven into a T and a P. Craft, character and care.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link href="/shop" className="btn-primary">Shop pork</Link><Link href="/farm" className="btn-outline">Our sourcing</Link></div>
        </div>
      </section>
      <section className="bg-forest py-16 text-ivory">
        <div className="container-x grid gap-6 md:grid-cols-3">
          {[["Transparency", "Honest weights, clear pricing and estimated weights labelled as such."], ["Freshness", "A cold chain from processing to your door — no shortcuts."], ["Service", "Real people on WhatsApp, flexible preparation and reliable delivery."]].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-ivory/15 bg-white/5 p-6"><h3 className="font-display text-3xl font-semibold text-gold-2">{t}</h3><p className="mt-2 text-ivory/80">{d}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}
