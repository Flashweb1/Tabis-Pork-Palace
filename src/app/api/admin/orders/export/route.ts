import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { orderConds } from "@/lib/order-filters";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// Quote every cell; neutralise spreadsheet formula injection for user-supplied text (=, +, -, @).
function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const user = await getSession();
  if (!user || !can(user.role, "orders")) return new Response("Forbidden", { status: 403 });
  const p = new URL(req.url).searchParams;
  const rows = await db
    .select()
    .from(orders)
    .where(orderConds({ status: p.get("status") ?? undefined, payment: p.get("payment") ?? undefined, q: p.get("q") ?? undefined, filter: p.get("filter") ?? undefined }))
    .orderBy(desc(orders.createdAt))
    .limit(5000);
  const head = ["Order", "Placed (UTC)", "Customer", "Phone", "Email", "State", "City", "Delivery", "Subtotal", "Delivery fee", "Discount", "Total", "Payment method", "Payment status", "Status"];
  const lines = [
    head.map(cell).join(","),
    ...rows.map((o) =>
      [o.code, o.createdAt.toISOString(), o.customerName, o.phone, o.email, o.state, o.city, o.deliveryMethod, o.subtotal, o.deliveryFee, o.discount, o.total, o.paymentMethod, o.paymentStatus, o.status].map(cell).join(","),
    ),
  ];
  return new Response("\ufeff" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tabis-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
