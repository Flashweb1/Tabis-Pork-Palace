"use client";

import { useCallback, useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
  stagger = false,
  as,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const node = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  const setRef = useCallback((el: HTMLElement | null) => {
    node.current = el;
  }, []);

  useEffect(() => {
    const el = node.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag
      ref={setRef}
      className={`${stagger ? "stagger" : "reveal"} ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
