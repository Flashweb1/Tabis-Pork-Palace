import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";
import { naira } from "@/lib/format";
import { getZones } from "@/lib/store";

export const metadata: Metadata = { title: "Delivery", description: "Zone-based chilled delivery for fresh pork across Lagos, Ibadan, Abuja and beyond." };

export default async function DeliveryPage() {
  const zones = await getZones();
  return (
    <>
      <PageHero eyebrow="Delivery" title="Chilled delivery, done properly" sub="Fresh meat needs more care in transit. Our delivery is zone-based, insulated and scheduled." />
      <section className="container-x py-16">
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead className="bg-forest text-ivory"><tr><th className="px-4 py-3 text-left text-xs uppercase tracking-wider">Zone</th><th className="px-4 py-3 text-left text-xs uppercase tracking-wider">Locations</th><th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Fee</th></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {zones.map((z) => (
                <tr key={z.id}><td className="td font-semibold text-forest">{z.name}<p className="text-xs font-normal text-charcoal/55">{z.note}</p></td><td className="td">{z.states.length ? z.states.join(", ") : "All other locations"}</td><td className="td text-right font-semibold">{z.contactOnly ? "Contact us" : naira(z.fee)}</td></tr>
              ))}
              <tr><td className="td font-semibold text-forest">Pickup</td><td className="td">Our facility</td><td className="td text-right font-semibold text-forest-2">FREE</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 rounded-lg bg-gold-3 p-4 text-sm text-[#6b5120]">Delivery availability may vary by location and product type. Fees may eventually vary by order weight and distance.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[["Standard delivery", "Usually within 1–2 days in your zone."], ["Scheduled delivery", "Pick the date that suits you — ideal for events."], ["Pickup", "Collect free from our facility. We notify you when it's ready."]].map(([t, d]) => (
            <div key={t} className="card p-6"><h2 className="font-display text-2xl font-semibold text-forest">{t}</h2><p className="mt-1 text-sm text-charcoal/70">{d}</p></div>
          ))}
        </div>
        <Link href="/legal/delivery-policy" className="mt-8 inline-block text-sm font-semibold text-forest underline">Read the delivery policy</Link>
      </section>
    </>
  );
}
