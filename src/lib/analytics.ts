import { sql } from "drizzle-orm";
import { db } from "@/db";

export type Range = "daily" | "weekly" | "monthly" | "yearly";

const CFG: Record<Range, { unit: string; step: string; back: string; fmt: string; title: string }> = {
  daily: { unit: "day", step: "1 day", back: "13 days", fmt: "DD Mon", title: "Last 14 days" },
  weekly: { unit: "week", step: "1 week", back: "11 weeks", fmt: "DD Mon", title: "Last 12 weeks" },
  monthly: { unit: "month", step: "1 month", back: "11 months", fmt: "Mon YY", title: "Last 12 months" },
  yearly: { unit: "year", step: "1 year", back: "4 years", fmt: "YYYY", title: "Last 5 years" },
};

export const rangeTitle = (r: Range) => CFG[r].title;
export const parseRange = (v: string | undefined): Range => (v === "weekly" || v === "monthly" || v === "yearly" ? v : "daily");

const LAGOS = (col: string) => `(${col} at time zone 'UTC' at time zone 'Africa/Lagos')`;
const PAID = `o.payment_status = 'paid' and o.status <> 'cancelled'`;

export async function revenueSeries(range: Range): Promise<{ label: string; revenue: number; orders: number }[]> {
  const c = CFG[range];
  const res = await db.execute(
    sql.raw(`
    select to_char(g, '${c.fmt}') as label, coalesce(sum(o.total),0)::int as revenue, count(o.id)::int as orders
    from generate_series(
      date_trunc('${c.unit}', now() at time zone 'Africa/Lagos') - interval '${c.back}',
      date_trunc('${c.unit}', now() at time zone 'Africa/Lagos'),
      interval '${c.step}') g
    left join orders o on date_trunc('${c.unit}', ${LAGOS("o.created_at")}) = g and ${PAID}
    group by g order by g`),
  );
  return (res.rows as { label: string; revenue: number; orders: number }[]).map((r) => ({ label: r.label, revenue: Number(r.revenue), orders: Number(r.orders) }));
}

export async function todayStats() {
  const res = await db.execute(
    sql.raw(`
    select
      coalesce(sum(case when ${PAID} then o.total end),0)::int as sales,
      count(*)::int as orders
    from orders o
    where date_trunc('day', ${LAGOS("o.created_at")}) = date_trunc('day', now() at time zone 'Africa/Lagos')`),
  );
  const r = res.rows[0] as { sales: number; orders: number };
  return { sales: Number(r.sales), orders: Number(r.orders) };
}

export async function salesByChannel() {
  const res = await db.execute(
    sql.raw(`
    select case
        when i.product_type = 'whole_pig' then 'Whole pig sales'
        when i.product_type in ('bulk','quote_required') or (i.unit = 'kg' and i.qty >= 21) then 'Wholesale sales'
        else 'Retail sales' end as channel,
      coalesce(sum(i.line_total),0)::int as revenue,
      count(distinct o.id)::int as orders
    from order_items i join orders o on o.id = i.order_id
    where ${PAID}
    group by 1 order by 2 desc`),
  );
  return (res.rows as { channel: string; revenue: number; orders: number }[]).map((r) => ({ channel: r.channel, revenue: Number(r.revenue), orders: Number(r.orders) }));
}

export async function topProducts(limit = 8) {
  const res = await db.execute(
    sql.raw(`
    select i.name, sum(i.qty)::float as qty, max(i.unit) as unit, coalesce(sum(i.line_total),0)::int as revenue
    from order_items i join orders o on o.id = i.order_id
    where ${PAID}
    group by i.name order by revenue desc limit ${Number(limit)}`),
  );
  return (res.rows as { name: string; qty: number; unit: string; revenue: number }[]).map((r) => ({ name: r.name, qty: Number(r.qty), unit: r.unit, revenue: Number(r.revenue) }));
}

export async function customerStats() {
  const res = await db.execute(
    sql.raw(`
    select
      (select count(*) from users where role = 'customer' and created_at > now() - interval '30 days')::int as new_customers,
      (select count(*) from (select lower(email) from orders o where ${PAID} group by 1 having count(*) >= 2) t)::int as returning_customers,
      (select coalesce(avg(total),0) from orders o where ${PAID})::int as aov,
      (select coalesce(sum(total)::float / nullif(count(distinct lower(email)),0),0) from orders o where ${PAID})::int as ltv,
      (select count(*) from users where role = 'customer')::int as customers`),
  );
  const r = res.rows[0] as Record<string, number>;
  return { newCustomers: Number(r.new_customers), returning: Number(r.returning_customers), aov: Number(r.aov), ltv: Number(r.ltv), customers: Number(r.customers) };
}
