import type { Metadata } from "next";
import { ActionForm } from "@/components/ActionForm";
import { PageHero } from "@/components/ui";
import { submitQuoteRequest } from "@/app/actions/shop";
import { getSession } from "@/lib/auth";
import { getProductBySlug } from "@/lib/store";

export const metadata: Metadata = { title: "Request a Wholesale Quote" };

const TYPES = ["Restaurant", "Hotel", "Caterer", "Supermarket", "Butcher", "Food vendor", "Event company", "Meat processor", "Individual (large order)", "Other"];

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const [user, p] = await Promise.all([getSession(), product ? getProductBySlug(product) : Promise.resolve(undefined)]);
  return (
    <>
      <PageHero eyebrow="Tabis Business" title="Request a wholesale quote" sub="Tell us what you need. Our sales team will send a priced quote you can accept and pay online." />
      <div className="container-x grid gap-10 py-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-6 sm:p-8">
          <ActionForm action={submitQuoteRequest} submit="Request wholesale quote" className="grid gap-4 sm:grid-cols-2" buttonClass="btn-primary w-full sm:col-span-2">
            <div><label className="label" htmlFor="businessName">Business name</label><input id="businessName" name="businessName" required className="input" /></div>
            <div><label className="label" htmlFor="contactPerson">Contact person</label><input id="contactPerson" name="contactPerson" required defaultValue={user?.name} className="input" /></div>
            <div><label className="label" htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" required defaultValue={user?.phone ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required defaultValue={user?.email} className="input" /></div>
            <div><label className="label" htmlFor="businessType">Business type</label><select id="businessType" name="businessType" className="input">{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className="label" htmlFor="quantity">Estimated quantity</label><input id="quantity" name="quantity" placeholder="e.g. 100kg weekly, 3 pigs" className="input" /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="productsRequired">Products required</label><textarea id="productsRequired" name="productsRequired" rows={3} defaultValue={p ? p.name : ""} placeholder="e.g. Pork belly, ribs, whole pigs (60–80kg) dressed" className="input" /></div>
            <div><label className="label" htmlFor="deliveryDate">Preferred delivery date</label><input id="deliveryDate" name="deliveryDate" type="date" className="input" /></div>
            <div><label className="label" htmlFor="location">Delivery location</label><input id="location" name="location" placeholder="Area, city, state" className="input" /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="notes">Additional requirements</label><textarea id="notes" name="notes" rows={3} className="input" placeholder="Cut specifications, packaging, invoicing, recurring supply…" /></div>
          </ActionForm>
        </div>
        <aside className="space-y-4">
          <div className="card p-6"><h2 className="font-display text-2xl font-semibold text-forest">What happens next?</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-charcoal/75"><li>You receive a reference like <strong>TP-Q-10484</strong>.</li><li>Our team sends a quote — usually within one business day.</li><li>Sign in, review the quote under <em>Wholesale Requests</em>, accept and pay.</li><li>Your order is created and tracked like any other.</li></ol></div>
          <div className="rounded-xl bg-forest-3 p-5 text-sm text-forest">Tip: sign in before submitting to track your quote and accept it online. Use the same email on your account.</div>
        </aside>
      </div>
    </>
  );
}
