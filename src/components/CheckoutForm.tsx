"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartNotices } from "@/components/CartNotices";
import { Icon } from "@/components/Icon";
import { useApp } from "@/components/AppProvider";
import { optionSummary } from "@/components/CartView";
import { checkCoupon, placeOrder } from "@/app/actions/shop";
import { NIGERIAN_STATES, naira, qtyLabel } from "@/lib/format";
import { deliveryQuote, type DeliveryZone } from "@/lib/pricing";

type Saved = { id: number; label: string; address: string; city: string; state: string };

const METHODS = [
  { value: "standard", label: "Standard Delivery", desc: "Delivered chilled, usually within 1–2 days" },
  { value: "scheduled", label: "Scheduled Delivery", desc: "Choose the date you want it delivered" },
  { value: "pickup", label: "Pickup", desc: "Collect free from our facility" },
];

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-5 flex items-center gap-3 font-display text-2xl font-semibold text-forest">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-forest font-sans text-sm text-gold-2">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function CheckoutInner({
  zones,
  podStates,
  user,
  saved,
  paystackLive,
  flutterwaveLive,
}: {
  zones: DeliveryZone[];
  podStates: string[];
  user: { name: string; email: string; phone: string } | null;
  saved: Saved[];
  paystackLive: boolean;
  flutterwaveLive: boolean;
}) {
  const app = useApp();
  const router = useRouter();
  const pigDelivery = app.items.find((i) => i.productType === "whole_pig")?.options.delivery;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("Lagos");
  const [city, setCity] = useState("");
  const [instructions, setInstructions] = useState("");
  const [method, setMethod] = useState(pigDelivery === "pickup" ? "pickup" : pigDelivery === "scheduled" ? "scheduled" : "standard");
  const [date, setDate] = useState("");
  const [payment, setPayment] = useState("paystack");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number; message: string } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const dq = useMemo(() => deliveryQuote(method, state, zones), [method, state, zones]);
  const podOk = method !== "pickup" && podStates.some((s) => s.toLowerCase() === state.toLowerCase());
  const subtotal = app.subtotal;
  const discount = applied?.discount ?? 0;
  const total = Math.max(0, subtotal - discount + dq.fee);
  const lines = useMemo(() => app.items.map((i) => ({ productId: i.productId, qty: i.qty, options: i.options })), [app.items]);
  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  useEffect(() => {
    if (payment === "pay_on_delivery" && !podOk) setPayment("paystack");
  }, [podOk, payment]);
  useEffect(() => {
    setApplied(null);
  }, [subtotal]);

  if (!app.ready) return <div className="mt-8 h-48 animate-pulse rounded-xl bg-forest/5" />;
  if (app.items.length === 0)
    return (
      <div className="card mx-auto mt-10 max-w-lg p-10 text-center">
        <h2 className="font-display text-3xl font-semibold text-forest">Your cart is empty</h2>
        <Link href="/shop" className="btn-primary mt-5">Shop pork</Link>
      </div>
    );

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setCouponMsg(null);
    const res = await checkCoupon(coupon, lines, email);
    if (res.ok) {
      setApplied({ code: res.code, discount: res.discount, message: res.message });
      setCouponMsg({ ok: true, text: `${res.code} applied — you save ${naira(res.discount)}` });
    } else {
      setApplied(null);
      setCouponMsg({ ok: false, text: res.error });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await placeOrder({
        customer: { name, email, phone },
        delivery: { address, state, city, instructions, method, date },
        paymentMethod: payment,
        couponCode: applied?.code,
        createPassword: createAccount && !user ? password : undefined,
        lines,
      });
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      app.clear();
      if (/^https?:/.test(res.redirect)) window.location.href = res.redirect;
      else {
        router.push(res.redirect);
        router.refresh();
      }
    } catch {
      setError("Something went wrong placing your order. Please try again.");
      setBusy(false);
    }
  }

  const pay = [
    { value: "paystack", label: "Paystack", desc: "Card, bank transfer, USSD" + (paystackLive ? "" : " · demo mode") },
    { value: "flutterwave", label: "Flutterwave", desc: "Card, bank, mobile money" + (flutterwaveLive ? "" : " · demo mode") },
    { value: "bank_transfer", label: "Bank Transfer", desc: "Transfer to our account — confirmed by our team" },
    ...(podOk ? [{ value: "pay_on_delivery", label: "Pay on Delivery", desc: "Available for your location" }] : []),
  ];

  return (
    <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

        <Section n={1} title="Customer">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label" htmlFor="c-name">Full name</label><input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} className="input" autoComplete="name" /></div>
            <div><label className="label" htmlFor="c-phone">Phone</label><input id="c-phone" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" autoComplete="tel" placeholder="080…" /></div>
            <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" /></div>
          </div>
          {!user && (
            <div className="mt-4 rounded-lg bg-forest-3 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-forest"><input type="checkbox" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} className="h-4 w-4 accent-[#123D27]" /> Create an account to track orders &amp; save addresses</label>
              {createAccount && <input type="password" minLength={8} placeholder="Choose a password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-3" aria-label="Password" autoComplete="new-password" />}
              <p className="mt-2 text-xs text-charcoal/60">Already registered? <Link href="/login?next=/checkout" className="font-semibold text-forest underline">Sign in</Link></p>
            </div>
          )}
        </Section>

        <Section n={2} title="Delivery details">
          {saved.length > 0 && (
            <div className="mb-4"><label className="label" htmlFor="saved">Saved addresses</label>
              <select id="saved" className="input" defaultValue="" onChange={(e) => { const a = saved.find((s) => s.id === Number(e.target.value)); if (a) { setAddress(a.address); setCity(a.city); if (a.state) setState(a.state); } }}>
                <option value="">Choose a saved address…</option>
                {saved.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.address}</option>)}
              </select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label" htmlFor="c-address">Address {method === "pickup" && <span className="normal-case text-charcoal/50">(optional for pickup)</span>}</label><input id="c-address" required={method !== "pickup"} value={address} onChange={(e) => setAddress(e.target.value)} className="input" autoComplete="street-address" /></div>
            <div><label className="label" htmlFor="c-state">State</label><select id="c-state" value={state} onChange={(e) => setState(e.target.value)} className="input">{NIGERIAN_STATES.map((s) => <option key={s}>{s.replace(" (FCT)", "") === "Abuja" ? "Abuja (FCT)" : s}</option>)}</select></div>
            <div><label className="label" htmlFor="c-city">City / Area</label><input id="c-city" value={city} onChange={(e) => setCity(e.target.value)} className="input" autoComplete="address-level2" /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="c-ins">Delivery instructions</label><textarea id="c-ins" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} className="input" placeholder="Landmark, gate code, preferred time…" /></div>
          </div>
        </Section>

        <Section n={3} title="Delivery method">
          <div className="grid gap-3 sm:grid-cols-3">
            {METHODS.map((m) => (
              <button type="button" key={m.value} onClick={() => setMethod(m.value)} aria-pressed={method === m.value} className={`rounded-xl border p-4 text-left transition ${method === m.value ? "border-forest bg-forest-3 ring-2 ring-forest" : "border-forest/15 bg-white hover:border-forest"}`}>
                <span className="block font-semibold text-forest">{m.label}</span>
                <span className="mt-1 block text-xs text-charcoal/65">{m.desc}</span>
              </button>
            ))}
          </div>
          {method === "scheduled" && <div className="mt-4 max-w-xs"><label className="label" htmlFor="c-date">Delivery date</label><input id="c-date" type="date" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)} className="input" /></div>}
          <p className="mt-4 flex items-start gap-2 text-sm text-charcoal/70"><Icon name="truck" className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
            {method === "pickup" ? "Free pickup — we'll notify you when your order is ready." : dq.tbc ? `${dq.zone?.name ?? "Your location"}: we'll confirm your delivery fee after you order.` : `${dq.zone?.name}: ${naira(dq.fee)} delivery.`} Delivery availability may vary by location and product type.</p>
        </Section>

        <Section n={4} title="Payment">
          <div className="grid gap-3 sm:grid-cols-2">
            {pay.map((m) => (
              <button type="button" key={m.value} onClick={() => setPayment(m.value)} aria-pressed={payment === m.value} className={`rounded-xl border p-4 text-left transition ${payment === m.value ? "border-forest bg-forest-3 ring-2 ring-forest" : "border-forest/15 bg-white hover:border-forest"}`}>
                <span className="block font-semibold text-forest">{m.label}</span>
                <span className="mt-1 block text-xs text-charcoal/65">{m.desc}</span>
              </button>
            ))}
          </div>
          {payment === "bank_transfer" && <p className="mt-4 text-sm text-charcoal/70">Our bank details will be shown right after you place the order. Your order is confirmed once we receive payment.</p>}
        </Section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card p-6">
          <h2 className="font-display text-3xl font-semibold text-forest">Order summary</h2>
          <ul className="mt-4 divide-y divide-forest/10">
            {app.items.map((i) => (
              <li key={i.key} className="flex justify-between gap-3 py-3 text-sm">
                <div className="min-w-0"><p className="font-semibold text-charcoal">{i.name}</p><p className="text-xs text-charcoal/60">{qtyLabel(i.qty, i.unit)}</p>{optionSummary(i).slice(0, 2).map((o) => <p key={o} className="text-xs text-charcoal/50">{o}</p>)}</div>
                <span className="font-semibold">{naira(app.lineOf(i))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" className="input !py-2" aria-label="Coupon code" />
            <button type="button" onClick={applyCoupon} className="btn-outline btn-sm">Apply</button>
          </div>
          {couponMsg && <p className={`mt-2 text-xs font-medium ${couponMsg.ok ? "text-forest-2" : "text-red-600"}`}>{couponMsg.text}</p>}
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-charcoal/65">Subtotal</dt><dd className="font-semibold">{naira(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/65">Delivery</dt><dd className="font-semibold">{method === "pickup" ? "FREE" : dq.tbc ? "To be confirmed" : naira(dq.fee)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-forest-2"><dt>Discount ({applied?.code})</dt><dd className="font-semibold">−{naira(discount)}</dd></div>}
            <div className="flex items-end justify-between border-t border-forest/10 pt-4"><dt className="font-semibold text-forest">Total</dt><dd className="font-display text-3xl font-semibold text-forest">{naira(total)}</dd></div>
          </dl>
          <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">{busy ? "Placing order…" : payment === "paystack" || payment === "flutterwave" ? "Place order & pay" : "Place order"}</button>
          <p className="mt-3 text-center text-xs text-charcoal/55">By placing your order you agree to our <Link href="/legal/terms" className="underline">terms</Link> and <Link href="/legal/refunds" className="underline">refund policy</Link>.</p>
        </div>
      </aside>
    </form>
  );
}

export function CheckoutForm(props: React.ComponentProps<typeof CheckoutInner>) {
  return (
    <>
      <CartNotices className="mt-6" />
      <CheckoutInner {...props} />
    </>
  );
}
