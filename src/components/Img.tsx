"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/Logo";

export function Img({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-forest-3 ${className}`} role="img" aria-label={alt}>
        <LogoMark className="h-1/3 max-h-24 w-auto opacity-30" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`img-fade ${loaded ? "is-loaded" : ""} ${className}`}
    />
  );
}
