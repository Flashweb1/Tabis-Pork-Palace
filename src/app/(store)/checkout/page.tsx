import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getSession } from "@/lib/auth";
import { getSettings, getZones } from "@/lib/store";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [user, zones, settings] = await Promise.all([getSession(), getZones(), getSettings()]);
  const saved = user ? await db.select().from(addresses).where(eq(addresses.userId, user.id)) : [];
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-5xl font-semibold text-forest">Checkout</h1>
      <CheckoutForm
        zones={zones}
        podStates={settings.pod_states.split(",").map((s) => s.trim()).filter(Boolean)}
        user={user ? { name: user.name, email: user.email, phone: user.phone ?? "" } : null}
        saved={saved.map((a) => ({ id: a.id, label: a.label, address: a.address, city: a.city, state: a.state }))}
        paystackLive={!!process.env.PAYSTACK_SECRET_KEY}
        flutterwaveLive={!!process.env.FLW_SECRET_KEY}
      />
    </div>
  );
}
