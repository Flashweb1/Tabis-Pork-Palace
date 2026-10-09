import { and, eq, ilike, or, type SQL } from "drizzle-orm";
import { orders } from "@/db/schema";

export type OrderFilter = { status?: string; payment?: string; q?: string; filter?: string };

/** Shared by the admin orders list and the CSV export so both always agree. */
export function orderConds(sp: OrderFilter): SQL | undefined {
  const conds: SQL[] = [];
  if (sp.status) conds.push(eq(orders.status, sp.status));
  if (sp.payment) conds.push(eq(orders.paymentStatus, sp.payment));
  if (sp.filter === "review") conds.push(eq(orders.needsReview, true));
  if (sp.q) {
    const like = `%${sp.q}%`;
    conds.push(or(ilike(orders.code, like), ilike(orders.customerName, like), ilike(orders.phone, like), ilike(orders.email, like))!);
  }
  return conds.length ? and(...conds) : undefined;
}
