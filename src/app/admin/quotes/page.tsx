import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { AdminHeader, Panel } from "@/components/admin/AdminUi";
import { StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { dateShort, naira } from "@/lib/format";

export const metadata: Metadata = { title: "Quotes" };

export default async function AdminQuotes({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin("quotes");
  const { status } = await searchParams;
  const list = await db.select().from(quotes).where(status ? eq(quotes.status, status) : undefined).orderBy(desc(quotes.createdAt));
  return (
    <div>
      <AdminHeader title="Wholesale requests & quotes" sub="Respond with a quote — customers accept & pay online to create the order." />
      <div className="mb-4 flex flex-wrap gap-2">{["", "new", "quoted", "accepted", "declined"].map((s) => <Link key={s} href={s ? `/admin/quotes?status=${s}` : "/admin/quotes"} className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize ${(status ?? "") === s ? "border-forest bg-forest text-ivory" : "border-forest/20 text-forest"}`}>{s || "All"}</Link>)}</div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-forest-3"><tr><th className="th">Quote</th><th className="th">Business</th><th className="th">Request</th><th className="th">Amount</th><th className="th">Status</th><th className="th">Received</th></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {list.map((q) => (
                <tr key={q.id} className="hover:bg-forest/5"><td className="td font-semibold"><Link href={`/admin/quotes/${q.id}`} className="text-forest hover:underline">#{q.code}</Link></td><td className="td">{q.businessName}<p className="text-xs text-charcoal/50">{q.contactPerson} · {q.businessType}</p></td><td className="td max-w-[260px] truncate text-charcoal/70">{q.productsRequired} — {q.quantity}</td><td className="td font-semibold">{q.quoteAmount ? naira(q.quoteAmount) : "—"}</td><td className="td"><StatusBadge status={q.status} /></td><td className="td text-charcoal/60">{dateShort(q.createdAt)}</td></tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="td py-10 text-center text-charcoal/55">No requests.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
