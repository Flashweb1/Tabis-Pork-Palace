import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { confirmationUrl, markOrderPaid, type CreatedOrder } from "@/lib/orders";

/**
 * Payment orchestration.
 * - Paystack / Flutterwave run live when PAYSTACK_SECRET_KEY / FLW_SECRET_KEY are set.
 * - Without keys, gateways run in DEMO mode (payment is auto-confirmed with a DEMO reference).
 * - Bank transfer & pay-on-delivery stay "pending" until the admin confirms them.
 */
export const paystackLive = () => !!process.env.PAYSTACK_SECRET_KEY;
export const flutterwaveLive = () => !!process.env.FLW_SECRET_KEY;

export async function startPayment(order: CreatedOrder, method: string, origin: string, viewerId: number | null): Promise<{ redirect: string; note?: string }> {
  const confirm = confirmationUrl(order, viewerId);
  const base = { orderId: order.id, method, amount: order.total, status: "pending" };

  if (method === "paystack" && paystackLive()) {
    const reference = `${order.code}-${Date.now()}`;
    try {
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: order.email,
          amount: order.total * 100,
          currency: "NGN",
          reference,
          callback_url: `${origin}/api/payments/callback?provider=paystack&order=${order.code}`,
          metadata: { order_code: order.code },
        }),
      });
      const json = (await res.json()) as { status?: boolean; data?: { authorization_url?: string } };
      if (json.status && json.data?.authorization_url) {
        await db.insert(s.payments).values({ ...base, reference });
        return { redirect: json.data.authorization_url };
      }
    } catch {
      /* fall through to pending */
    }
    await db.insert(s.payments).values({ ...base, reference: "gateway-unavailable" });
    return { redirect: confirm };
  }

  if (method === "flutterwave" && flutterwaveLive()) {
    const reference = `${order.code}-${Date.now()}`;
    try {
      const res = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_ref: reference,
          amount: order.total,
          currency: "NGN",
          redirect_url: `${origin}/api/payments/callback?provider=flutterwave&order=${order.code}`,
          customer: { email: order.email, name: order.customerName, phonenumber: order.phone },
          customizations: { title: "Tabis Pork Palace", description: `Order ${order.code}` },
        }),
      });
      const json = (await res.json()) as { status?: string; data?: { link?: string } };
      if (json.status === "success" && json.data?.link) {
        await db.insert(s.payments).values({ ...base, reference });
        return { redirect: json.data.link };
      }
    } catch {
      /* fall through */
    }
    await db.insert(s.payments).values({ ...base, reference: "gateway-unavailable" });
    return { redirect: confirm };
  }

  if (method === "paystack" || method === "flutterwave") {
    // Demo gateway — no secret key configured.
    const reference = `DEMO-${method.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-8)}`;
    await db.insert(s.payments).values({ ...base, reference });
    await markOrderPaid(order.id, reference, "Payment confirmed (demo gateway)");
    return { redirect: confirm };
  }

  await db.insert(s.payments).values({ ...base, reference: method === "bank_transfer" ? `BT-${order.code}` : `POD-${order.code}` });
  return { redirect: confirm };
}

export async function verifyGatewayPayment(provider: string, params: URLSearchParams): Promise<{ ok: boolean; reference: string }> {
  try {
    if (provider === "paystack") {
      const reference = params.get("reference") || params.get("trxref") || "";
      const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      const json = (await res.json()) as { data?: { status?: string } };
      return { ok: json.data?.status === "success", reference };
    }
    if (provider === "flutterwave") {
      const id = params.get("transaction_id") || "";
      const reference = params.get("tx_ref") || "";
      if (params.get("status") !== "successful" || !id) return { ok: false, reference };
      const res = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(id)}/verify`, {
        headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      });
      const json = (await res.json()) as { status?: string; data?: { status?: string; tx_ref?: string } };
      return { ok: json.status === "success" && json.data?.status === "successful" && json.data?.tx_ref === reference, reference };
    }
  } catch {
    /* ignore */
  }
  return { ok: false, reference: "" };
}

export async function markPaymentFailed(orderId: number, reference: string) {
  await db.update(s.payments).set({ status: "failed" }).where(and(eq(s.payments.orderId, orderId), eq(s.payments.status, "pending")));
  await db.update(s.orders).set({ paymentStatus: "failed" }).where(eq(s.orders.id, orderId));
  void reference;
}
