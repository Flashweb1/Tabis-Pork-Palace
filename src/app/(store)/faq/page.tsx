import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";
import { FAQ } from "@/lib/guide";

export const metadata: Metadata = { title: "FAQ", description: "Answers about fresh pork, weight-based pricing, whole pigs, delivery, payment and wholesale orders." };

export default function FaqPage() {
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero eyebrow="FAQ" title="Frequently asked questions" />
      <section className="container-x max-w-3xl py-16">
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card group p-5 open:shadow-md">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-2xl font-semibold text-forest">{f.q}<span className="text-gold transition group-open:rotate-45">+</span></summary>
              <p className="mt-3 leading-relaxed text-charcoal/75">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-charcoal/70">Still need help? <Link href="/contact" className="font-semibold text-forest underline">Contact us</Link>.</p>
      </section>
    </>
  );
}
