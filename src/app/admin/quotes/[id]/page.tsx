import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, quotes } from "@/db/schema";
import { AdminHeader, F, Panel } from "@/components/admin/AdminUi";
import { StatusBadge } from "@/components/ui";
import { declineQuoteAdmin, sendQuote } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { dateTime, naira } from "@/lib/format";

export const metadata: Metadata = { title: "Quote" };

export default async function AdminQuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("quotes");
  const { id } = await params;
  const q = (await db.select().from(quotes).where(eq(quotes.id, Number(id))).limit(1))[0];
  if (!q) notFound();
  const order = q.orderId ? (await db.select().from(orders).where(eq(orders.id, q.orderId)).limit(1))[0] : undefined;
  const wa = `https://wa.me/${q.phone.replace(/\D/g, "").replace(/^0/, "234")}?text=${encodeURIComponent(`Hello ${q.contactPerson}, this is Tabis Pork Palace about quote ${q.code}.`)}`;
  const rows: [string, string][] = [["Business", q.businessName], ["Contact person", q.contactPerson], ["Phone", q.phone], ["Email", q.email], ["Business type", q.businessType], ["Products required", q.productsRequired], ["Estimated quantity", q.quantity], ["Preferred delivery", q.deliveryDate], ["Location", q.location], ["Additional requirements", q.notes]];
  return (
    <div>
      <Link href="/admin/quotes" className="text-sm font-semibold text-forest hover:underline">← Quotes</Link>
      <AdminHeader title={`Quote #${q.code}`} sub={`Received ${dateTime(q.createdAt)}`} actions={<StatusBadge status={q.status} />} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Request">
          <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">{rows.map(([k, v]) => (<div key={k} className={k === "Additional requirements" || k === "Products required" ? "sm:col-span-2" : ""}><dt className="text-charcoal/55">{k}</dt><dd className="font-medium">{v || "—"}</dd></div>))}</dl>
          <div className="border-t border-forest/10 p-4"><a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm">Message on WhatsApp</a></div>
        </Panel>
        <Panel title="Your response">
          <div className="space-y-4 p-5">
            {q.status === "accepted" && order && <p className="rounded-lg bg-forest-3 p-3 text-sm text-forest">Accepted by customer. Order <Link href={`/admin/orders/${order.id}`} className="font-semibold underline">#{order.code}</Link> created ({naira(order.total)}).</p>}
            {q.status === "declined" && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">This quote was declined.</p>}
            {(q.status === "new" || q.status === "quoted") && (
              <form action={sendQuote} className="space-y-3">
                <input type="hidden" name="quoteId" value={q.id} />
                <F label="Quote amount (₦)"><input name="amount" type="number" min={1} required defaultValue={q.quoteAmount ?? ""} className="input !py-2" /></F>
                <F label="Quote details & validity"><textarea name="note" rows={5} defaultValue={q.quoteNote} placeholder="Itemised pricing, delivery terms, validity period…" className="input !py-2" /></F>
                <button className="btn-primary w-full">{q.status === "quoted" ? "Update quote" : `Send quote ${q.code}`}</button>
                <p className="text-xs text-charcoal/55">The customer is notified in-app (if they have an account with this email) and sees Accept → Pay under Wholesale Requests.</p>
              </form>
            )}
            {q.status !== "accepted" && q.status !== "declined" && <form action={declineQuoteAdmin}><input type="hidden" name="quoteId" value={q.id} /><button className="text-sm font-semibold text-red-600 hover:underline">Decline request</button></form>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
