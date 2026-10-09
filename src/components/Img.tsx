"use client";

import { useState } from "react";
import { LogoMark } from "@/components/Logo";

export function Img({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-forest-3 ${className}`} role="img" aria-label={alt}>
        <LogoMark className="h-1/3 max-h-24 w-auto opacity-30" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />;
}
