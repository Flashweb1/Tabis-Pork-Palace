import type { Metadata } from "next";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Payment methods" };

export default function PaymentMethodsPage() {
  return (
    <div>
      <h1 className="font-display text-5xl font-semibold text-forest">Payment Methods</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          ["Paystack & Flutterwave", "Pay securely with your card, bank or USSD at checkout. Card details are handled by the payment provider — Tabis never stores them."],
          ["Bank transfer", "Choose bank transfer at checkout and use your order number as the reference. We confirm your order once payment lands."],
          ["Pay on delivery", "Available for selected locations. Pay our rider when your order arrives."],
          ["Saved cards", "Tokenised saved cards will appear here once live gateway keys are connected by the Tabis team."],
        ].map(([t, d]) => (
          <div key={t} className="card flex gap-4 p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest text-gold-2"><Icon name="shield" className="h-5 w-5" /></span><div><h2 className="font-display text-2xl font-semibold text-forest">{t}</h2><p className="mt-1 text-sm text-charcoal/70">{d}</p></div></div>
        ))}
      </div>
    </div>
  );
}
