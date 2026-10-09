import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { confirmationUrl, markOrderPaid } from "@/lib/orders";
import { markPaymentFailed, verifyGatewayPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") ?? "";
  const code = url.searchParams.get("order") ?? "";
  const o = (await db.select().from(orders).where(eq(orders.code, code)).limit(1))[0];
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? url.host;
  const proto = h.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const origin = `${proto}://${host}`;
  if (!o) return NextResponse.redirect(`${origin}/`);
  const user = await getSession();
  const result = await verifyGatewayPayment(provider, url.searchParams);
  if (result.ok) await markOrderPaid(o.id, result.reference, `Payment confirmed via ${provider}`);
  else await markPaymentFailed(o.id, result.reference);
  return NextResponse.redirect(`${origin}${confirmationUrl(o, user?.id ?? null)}`);
}
