"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { Cut } from "@/lib/guide";

// Stylised side-on pig, facing left. Each zone maps to one or more cuts.
const ZONES: { id: string; label: string; cut: string; d: string; lx: number; ly: number }[] = [
  { id: "head", label: "Head", cut: "head", d: "M40 120 Q40 70 100 68 L140 80 L140 190 Q100 205 62 180 Q40 160 40 120Z", lx: 88, ly: 130 },
  { id: "shoulder", label: "Shoulder", cut: "shoulder", d: "M140 80 L250 66 L255 150 L140 150Z", lx: 196, ly: 112 },
  { id: "loin", label: "Loin & chops", cut: "loin", d: "M250 66 L390 62 L392 140 L255 150Z", lx: 322, ly: 106 },
  { id: "leg", label: "Leg", cut: "leg", d: "M390 62 Q470 60 510 110 Q530 160 500 215 L440 215 L392 140Z", lx: 452, ly: 138 },
  { id: "ribs", label: "Ribs", cut: "ribs", d: "M140 150 L255 150 L392 140 L392 175 L260 185 L140 190Z", lx: 270, ly: 168 },
  { id: "belly", label: "Belly", cut: "belly", d: "M140 190 L260 185 L392 175 L440 215 L360 240 L190 240 Q150 225 140 190Z", lx: 290, ly: 214 },
  { id: "feet", label: "Trotters", cut: "feet", d: "M150 240 L190 240 L190 280 L150 280Z M360 240 L400 240 L400 280 L360 280Z", lx: 170, ly: 266 },
];

export function CutExplorer({ cuts, slugs }: { cuts: Cut[]; slugs: Record<string, string> }) {
  const [id, setId] = useState(cuts[0].id);
  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (h && cuts.some((c) => c.id === h)) setId(h);
  }, [cuts]);
  const cut = cuts.find((c) => c.id === id) ?? cuts[0];
  const Meter = ({ label, v }: { label: string; v: number }) => (
    <div>
      <div className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wider text-forest/70"><span>{label}</span><span>{v}/5</span></div>
      <div className="h-2 rounded-full bg-forest/10"><div className="h-2 rounded-full bg-gold" style={{ width: `${v * 20}%` }} /></div>
    </div>
  );
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="card paper p-4 sm:p-6">
          <svg viewBox="20 40 530 260" className="w-full" role="img" aria-label="Pork cuts map">
            {ZONES.map((z) => {
              const active = z.cut === id;
              return (
                <g key={z.id} onClick={() => setId(z.cut)} className="cursor-pointer" role="button" tabIndex={0} aria-label={z.label} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setId(z.cut)}>
                  <path d={z.d} fill={active ? "#B28A3A" : "#285B3A"} fillOpacity={active ? 0.95 : 0.85} stroke="#F7F4EC" strokeWidth="3" className="transition hover:fill-[#123D27]" />
                  <text x={z.lx} y={z.ly} textAnchor="middle" fontSize="13" fontWeight="700" fill="#F7F4EC" style={{ pointerEvents: "none" }}>{z.label}</text>
                </g>
              );
            })}
            <circle cx="92" cy="104" r="5" fill="#F7F4EC" />
          </svg>
          <p className="mt-2 text-center text-xs text-charcoal/55">Tap a region of the pig, or choose a cut below.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {cuts.map((c) => (
            <button key={c.id} onClick={() => setId(c.id)} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${c.id === id ? "border-forest bg-forest text-ivory" : "border-forest/20 text-forest hover:border-forest"}`}>{c.name}</button>
          ))}
        </div>
      </div>
      <article className="card h-fit p-6 sm:p-8" id={cut.id}>
        <p className="eyebrow">{cut.area}</p>
        <h2 className="mt-1 font-display text-5xl font-semibold text-forest">{cut.name}</h2>
        <p className="mt-3 text-charcoal/75">{cut.about}</p>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gold">Best for</p>
        <ul className="mt-2 grid grid-cols-2 gap-2">{cut.bestFor.map((b) => <li key={b} className="flex items-center gap-2 text-sm font-medium text-forest"><Icon name="check" className="h-4 w-4 text-forest-2" />{b}</li>)}</ul>
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><Meter label="Tenderness" v={cut.tender} /><Meter label="Fat" v={cut.fat} /></div>
        <div className="mt-6 rounded-lg bg-forest-3 p-4 text-sm"><p className="font-semibold text-forest">How to cook it</p><p className="mt-1 text-charcoal/75">{cut.method}</p></div>
        <p className="mt-3 text-sm text-charcoal/65"><strong className="text-forest">Chef&apos;s tip:</strong> {cut.tip}</p>
        <Link href={`/product/${slugs[cut.id] ?? cut.product}`} className="btn-primary mt-6 w-full">Shop {cut.name}</Link>
      </article>
    </div>
  );
}
