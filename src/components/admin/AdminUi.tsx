import type { ReactNode } from "react";

export function AdminHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-4xl font-semibold text-forest sm:text-5xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-charcoal/60">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, actions, className = "" }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-forest/10 px-5 py-4">
          {title && <h2 className="font-display text-2xl font-semibold text-forest">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-forest/60">{label}</p>
      <p className="mt-2 font-display text-4xl font-semibold leading-none text-forest">{value}</p>
      {hint && <p className="mt-2 text-xs text-charcoal/55">{hint}</p>}
    </div>
  );
}

export function BarChart({ data, money = true }: { data: { label: string; value: number }[]; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = (n: number) => (money ? `₦${n.toLocaleString("en-NG")}` : String(n));
  return (
    <div>
      <div className="flex h-56 items-end gap-1.5 sm:gap-2" role="img" aria-label="Bar chart">
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
            <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-forest px-2 py-1 text-xs font-semibold text-ivory group-hover:block">{d.label}: {fmt(d.value)}</div>
            <div className="w-full rounded-t bg-gradient-to-t from-forest to-forest-2 transition group-hover:from-gold group-hover:to-gold-2" style={{ height: `${Math.max(d.value > 0 ? 3 : 0.5, (d.value / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {data.map((d, i) => (
          <span key={d.label + i} className="flex-1 truncate text-center text-[10px] text-charcoal/50">{data.length > 12 && i % 2 ? "" : d.label}</span>
        ))}
      </div>
    </div>
  );
}

export const inputCls = "input !py-2";

export function F({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
