import { sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, users } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * Daily Vercel Cron target. Supabase Free projects pause after 7 days of low
 * activity; a few real queries each day keeps the project active. Vercel sends
 * `Authorization: Bearer $CRON_SECRET` automatically when CRON_SECRET is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    await db.execute(sql.raw("select 1"));
    const [productCount, userCount, orderCount] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(products),
      db.select({ n: sql<number>`count(*)::int` }).from(users),
      db.select({ n: sql<number>`count(*)::int` }).from(orders),
    ]);

    return Response.json({
      ok: true,
      at: new Date().toISOString(),
      products: productCount[0].n,
      users: userCount[0].n,
      orders: orderCount[0].n,
    });
  } catch {
    // Never expose connection details (they can contain host/user names).
    return Response.json({ ok: false, error: "database unavailable" }, { status: 500 });
  }
}
