import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { Img } from "@/components/Img";
import { PAYMENT_LABEL, STATUS_LABEL } from "@/lib/format";
import type { StockState } from "@/lib/store";

export function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-gold" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" fill={i <= Math.round(rating)} className={`${size} ${i <= Math.round(rating) ? "" : "text-gold/30"}`} />
      ))}
    </span>
  );
}

export function StockBadge({ state, stock, unit }: { state: StockState; stock: number; unit: string }) {
  if (state === "quote") return <span className="badge bg-gold-3 text-[#7a5d22]">Quote required</span>;
  if (state === "out") return <span className="badge bg-red-50 text-red-700">Out of stock</span>;
  if (state === "low")
    return (
      <span className="badge bg-amber-50 text-amber-800">
        Low stock{unit === "pig" ? ` · ${stock} left` : ""}
      </span>
    );
  return (
    <span className="badge bg-forest-3 text-forest">
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
      Available
    </span>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  confirmed: "bg-sky-50 text-sky-800",
  preparing: "bg-indigo-50 text-indigo-800",
  ready: "bg-violet-50 text-violet-800",
  dispatched: "bg-cyan-50 text-cyan-800",
  delivered: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-red-50 text-red-700",
  paid: "bg-emerald-50 text-emerald-800",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-slate-100 text-slate-700",
  new: "bg-amber-50 text-amber-800",
  quoted: "bg-sky-50 text-sky-800",
  accepted: "bg-emerald-50 text-emerald-800",
  declined: "bg-red-50 text-red-700",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
  available: "bg-emerald-50 text-emerald-800",
  reserved: "bg-amber-50 text-amber-800",
  sold: "bg-slate-100 text-slate-700",
};

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? PAYMENT_LABEL[status] ?? status.replace(/_/g, " ");
  return <span className={`badge capitalize ${STATUS_STYLE[status] ?? "bg-slate-100 text-slate-700"}`}>{label}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  center = false,
  light = false,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
  center?: boolean;
  light?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className={`mb-8 flex flex-wrap items-end justify-between gap-4 ${center ? "justify-center text-center" : ""}`}>
      <div className={center ? "mx-auto max-w-2xl" : "max-w-2xl"}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className={`h-section ${light ? "!text-ivory" : ""}`}>{title}</h2>
        <div className={`gold-rule mt-4 ${center ? "mx-auto" : ""}`} />
        {sub && <p className={`mt-4 text-base leading-relaxed ${light ? "text-ivory/75" : "text-charcoal/70"}`}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  sub,
  image,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
  image?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-forest text-ivory">
      {image && <Img src={image} alt="" className="kenburns absolute inset-0 h-full w-full object-cover opacity-25" />}
      <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/90 to-forest/60" />
      <div className="absolute inset-0 bg-[radial-gradient(130%_130%_at_15%_10%,transparent_40%,rgba(6,20,13,0.55)_100%)]" />
      <div className="grain-layer" aria-hidden />
      <div className="container-x relative z-[2] py-14 sm:py-20">
        {eyebrow && <p className="eyebrow mb-3 !text-gold-2">{eyebrow}</p>}
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">{title}</h1>
        <div className="gold-rule mt-5" />
        {sub && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ivory/80">{sub}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}

export function EmptyState({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="card mx-auto max-w-lg p-10 text-center">
      <h3 className="font-display text-3xl font-semibold text-forest">{title}</h3>
      {text && <p className="mt-2 text-charcoal/70">{text}</p>}
      {children && <div className="mt-6 flex justify-center gap-3">{children}</div>}
    </div>
  );
}
