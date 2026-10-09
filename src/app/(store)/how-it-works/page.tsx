import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "How It Works" };

export default function HowItWorksPage() {
  const steps = [
    ["Choose", "Browse cuts, packs, whole pigs or bulk cartons. Pick your weight and see the price update instantly."],
    ["Customise", "For whole pigs, choose estimated weight, preparation (whole, cleaned, dressed, custom) and delivery preference."],
    ["Check out", "Enter your details, pick delivery or pickup and pay with Paystack, Flutterwave, bank transfer or pay on delivery."],
    ["Track", "Follow your order from confirmation to preparation to delivery in your account or with your order number."],
    ["Enjoy", "Open a chilled, labelled, accurately weighed order and cook something wonderful."],
  ];
  return (
    <>
      <PageHero eyebrow="How it works" title="Order in minutes. Enjoy for days." />
      <section className="container-x py-16">
        <ol className="grid gap-5 md:grid-cols-5">{steps.map(([t, d], i) => (<li key={t} className="card p-5"><span className="font-display text-5xl font-semibold text-gold/50">{i + 1}</span><h2 className="font-display text-2xl font-semibold text-forest">{t}</h2><p className="mt-1 text-sm text-charcoal/70">{d}</p></li>))}</ol>
        <div className="mt-10 flex gap-3"><Link href="/shop" className="btn-primary">Start shopping</Link><Link href="/faq" className="btn-outline">Read the FAQ</Link></div>
      </section>
    </>
  );
}
