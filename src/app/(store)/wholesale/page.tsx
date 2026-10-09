import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHero, SectionHeading } from "@/components/ui";
import { tierRangeLabel } from "@/lib/pricing";
import { getTiers } from "@/lib/store";

export const metadata: Metadata = {
  title: "Wholesale Pork Supply — Tabis Business",
  description: "Bulk and wholesale pork supply for restaurants, hotels, caterers, supermarkets, butchers and event companies in Nigeria. Tiered pricing and custom quotes.",
};

export default async function WholesalePage() {
  const tiers = await getTiers();
  return (
    <>
      <PageHero eyebrow="Tabis Business" title="Pork supply built for your business" sub="Consistent quality, tiered pricing and a proper quote-to-order workflow for restaurants, hotels, caterers, supermarkets, butchers, vendors and processors." image="https://images.pexels.com/photos/31647676/pexels-photo-31647676.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600">
        <Link href="/quote" className="btn-gold">Request wholesale quote</Link>
        <Link href="/category/bulk-orders" className="btn-ghost-light">Shop bulk products</Link>
      </PageHero>

      <section className="container-x pt-16">
        <SectionHeading eyebrow="Who we supply" title="Built for volume buyers" />
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {["Restaurants", "Hotels", "Caterers", "Supermarkets", "Butchers", "Food vendors", "Event companies", "Meat processors"].map((t) => (
            <li key={t} className="card flex items-center gap-3 p-4 font-semibold text-forest"><Icon name="check" className="h-5 w-5 text-gold" />{t}</li>
          ))}
        </ul>
      </section>

      <section className="container-x pt-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Bulk pricing" title="The more you buy, the better the price" sub="Tier discounts apply automatically to weight-based and bulk products in your cart. Exact pricing is managed by our team." />
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-forest text-ivory"><tr><th className="px-4 py-3 text-left text-xs uppercase tracking-wider">Quantity</th><th className="px-4 py-3 text-left text-xs uppercase tracking-wider">Pricing</th><th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Saving</th></tr></thead>
                <tbody className="divide-y divide-forest/10">
                  {tiers.map((t, i) => (
                    <tr key={t.label}><td className="td font-semibold">{tierRangeLabel(tiers, i)}</td><td className="td">{t.label}</td><td className="td text-right font-semibold text-forest">{t.discountPercent > 0 ? `−${t.discountPercent}%` : "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="How it works" title="From request to delivery" />
            <ol className="space-y-4">
              {[["Request a quote", "Tell us what you need, how much, and when."], ["Receive Quote #TP-Q…", "Our sales team replies with a priced quote."], ["Accept & pay", "Accept the quote online and pay by transfer, Paystack or Flutterwave."], ["Order created & delivered", "Your order is prepared, tracked and delivered on schedule."]].map(([t, d], i) => (
                <li key={t} className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest font-display text-xl text-gold-2">{i + 1}</span><div><h3 className="font-display text-2xl font-semibold text-forest">{t}</h3><p className="text-sm text-charcoal/70">{d}</p></div></li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="container-x pt-16">
        <div className="rounded-2xl bg-forest p-8 text-center text-ivory sm:p-12">
          <h2 className="font-display text-4xl font-semibold sm:text-5xl">Ready for a supply partner you can rely on?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ivory/75">Send us your requirements — whole pigs, cartons, weekly supply or one-off events.</p>
          <Link href="/quote" className="btn-gold mt-6">Request wholesale quote</Link>
        </div>
      </section>
    </>
  );
}
