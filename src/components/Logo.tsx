const GREEN = "#123D27";
const GOLD = "#B28A3A";

/** TP monogram (T + P formed by a pig profile) recreated as scalable SVG. */
export function LogoMark({ className = "h-10 w-auto", light = false }: { className?: string; light?: boolean }) {
  const g = light ? "#F7F4EC" : GREEN;
  return (
    <svg viewBox="70 20 690 630" className={className} role="img" aria-label="Tabis Pork Palace monogram">
      <defs>
        <linearGradient id="tpgold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#C9A455" />
          <stop offset="1" stopColor="#9C7630" />
        </linearGradient>
      </defs>
      {/* T crossbar */}
      <rect x="90" y="65" width="295" height="105" fill={g} />
      <rect x="90" y="170" width="215" height="58" fill="url(#tpgold)" />
      {/* P: back arc + pig head */}
      <path
        d="M335 560 V215 Q335 92 470 92 H590 L640 34 L648 128 Q735 150 735 214 Q735 262 662 296 Q604 325 536 328 H470"
        fill="none"
        stroke={g}
        strokeWidth="62"
        strokeLinejoin="round"
      />
      <circle cx="610" cy="188" r="20" fill={light ? "#123D27" : "#F7F4EC"} />
      {/* inner T and P stem in gold */}
      <rect x="380" y="172" width="150" height="62" fill="url(#tpgold)" />
      <rect x="408" y="172" width="60" height="150" fill="url(#tpgold)" />
      {/* right stem + hook to bottom bar */}
      <path d="M438 322 V470 Q438 600 330 600 H235" fill="none" stroke={g} strokeWidth="58" strokeLinejoin="round" />
      <rect x="425" y="572" width="108" height="58" fill="url(#tpgold)" />
      <rect x="300" y="470" width="58" height="70" fill="url(#tpgold)" />
    </svg>
  );
}

export function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark className="h-11 w-auto" light={light} />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.7rem] font-bold tracking-[0.08em] ${light ? "text-ivory" : "text-forest"}`}>TABIS</span>
        <span className="mt-1 text-[0.62rem] font-bold tracking-[0.32em] text-gold">PORK PALACE</span>
      </span>
    </span>
  );
}

export const BRAND = { GREEN, GOLD };
