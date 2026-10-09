import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { ActionForm } from "@/components/ActionForm";
import { StatusBadge } from "@/components/ui";
import { acceptQuote, declineQuote } from "@/app/actions/shop";
import { requireUser } from "@/lib/auth";
import { dateShort, naira } from "@/lib/format";

export const metadata: Metadata = { title: "Wholesale requests" };

export default async function QuotesPage() {
  const user = await requireUser("/account/quotes");
  const list = await db.select().from(quotes).where(or(eq(quotes.userId, user.id), sql`lower(${quotes.email}) = ${user.email.toLowerCase()}`)).orderBy(desc(quotes.createdAt));
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-5xl font-semibold text-forest">Wholesale Requests</h1><Link href="/quote" className="btn-primary btn-sm">New quote request</Link></div>
      <div className="mt-6 space-y-5">
        {list.length === 0 && <p className="card p-8 text-charcoal/65">No wholesale requests yet. Need pork for your business? <Link href="/quote" className="font-semibold text-forest underline">Request a quote</Link>.</p>}
        {list.map((q) => (
          <article key={q.id} className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Quote</p><h2 className="font-display text-3xl font-semibold text-forest">#{q.code}</h2><p className="text-sm text-charcoal/60">{q.businessName} · requested {dateShort(q.createdAt)}</p></div><StatusBadge status={q.status} /></div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-charcoal/55">Products</dt><dd className="font-medium">{q.productsRequired || "—"}</dd></div><div><dt className="text-charcoal/55">Quantity</dt><dd className="font-medium">{q.quantity || "—"}</dd></div><div><dt className="text-charcoal/55">Delivery</dt><dd className="font-medium">{q.location || "—"} · {q.deliveryDate || "—"}</dd></div></dl>
            {q.status === "quoted" && q.quoteAmount && (
              <div className="mt-5 rounded-xl border border-gold/50 bg-gold-3/60 p-5">
                <p className="text-sm text-charcoal/70">Your quote</p>
                <p className="font-display text-4xl font-semibold text-forest">{naira(q.quoteAmount)}</p>
                {q.quoteNote && <p className="mt-2 text-sm text-charcoal/75">{q.quoteNote}</p>}
                <ActionForm action={acceptQuote} submit="Accept quote & pay" className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" buttonClass="btn-primary sm:w-auto">
                  <input type="hidden" name="quoteId" value={q.id} />
                  <div className="sm:w-60"><label className="label" htmlFor={`pm-${q.id}`}>Payment method</label><select id={`pm-${q.id}`} name="paymentMethod" className="input"><option value="bank_transfer">Bank transfer</option><option value="paystack">Paystack</option><option value="flutterwave">Flutterwave</option></select></div>
                </ActionForm>
                <form action={declineQuote} className="mt-3"><input type="hidden" name="quoteId" value={q.id} /><button className="text-sm font-semibold text-red-600 hover:underline">Decline quote</button></form>
              </div>
            )}
            {q.status === "accepted" && <p className="mt-4 text-sm font-semibold text-forest-2">Accepted — an order was created. <Link href="/account/orders" className="underline">View orders</Link></p>}
          </article>
        ))}
      </div>
    </div>
  );
}
