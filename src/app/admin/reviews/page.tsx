import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { AdminHeader, Panel } from "@/components/admin/AdminUi";
import { Icon } from "@/components/Icon";
import { Stars, StatusBadge } from "@/components/ui";
import { moderateReview } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { dateShort } from "@/lib/format";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviews({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin("reviews");
  const { status } = await searchParams;
  const list = await db.select({ r: reviews, product: products.name }).from(reviews).innerJoin(products, eq(products.id, reviews.productId)).where(status ? eq(reviews.status, status) : undefined).orderBy(desc(reviews.createdAt));
  const btn = (id: number, st: string, label: string, cls: string) => (<form action={moderateReview}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={st} /><button className={`btn-sm rounded-lg border px-3 py-1.5 text-xs font-semibold ${cls}`}>{label}</button></form>);
  return (
    <div>
      <AdminHeader title="Reviews" sub="Approve or reject customer reviews before they appear on product pages." />
      <div className="mb-4 flex flex-wrap gap-2">{["", "pending", "approved", "rejected"].map((s) => <Link key={s} href={s ? `/admin/reviews?status=${s}` : "/admin/reviews"} className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize ${(status ?? "") === s ? "border-forest bg-forest text-ivory" : "border-forest/20 text-forest"}`}>{s || "All"}</Link>)}</div>
      <Panel>
        <ul className="divide-y divide-forest/10">
          {list.map(({ r, product }) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-3"><Stars rating={r.rating} /><StatusBadge status={r.status} /><span className="text-xs text-charcoal/50">{dateShort(r.createdAt)}</span></div>
                <p className="mt-2 text-charcoal/85">“{r.comment}”</p>
                <p className="mt-1 text-sm"><span className="font-semibold">{r.name}</span> on <span className="text-forest">{product}</span>{r.verified && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-forest-2"><Icon name="check" className="h-3.5 w-3.5" /> Verified Purchase</span>}</p>
              </div>
              <div className="flex gap-2">{r.status !== "approved" && btn(r.id, "approved", "Approve", "border-emerald-600 text-emerald-700 hover:bg-emerald-50")}{r.status !== "rejected" && btn(r.id, "rejected", "Reject", "border-amber-600 text-amber-700 hover:bg-amber-50")}{btn(r.id, "delete", "Delete", "border-red-600 text-red-600 hover:bg-red-50")}</div>
            </li>
          ))}
          {list.length === 0 && <li className="p-8 text-center text-charcoal/55">No reviews.</li>}
        </ul>
      </Panel>
    </div>
  );
}
