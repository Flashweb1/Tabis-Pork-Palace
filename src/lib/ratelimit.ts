import { headers } from "next/headers";

// Lightweight in-memory limiter (per server process). Good protection against
// casual brute-force and form spam; use Redis/Upstash if you scale to many instances.
const hits = new Map<string, { n: number; reset: number }>();

async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0].trim();
  } catch {
    return "local";
  }
}

export async function allow(scope: string, max: number, windowMs: number, extra = ""): Promise<boolean> {
  const key = `${scope}:${await clientIp()}:${extra.toLowerCase()}`;
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  h.n += 1;
  return h.n <= max;
}

/** Clear a counter after a successful action (e.g. a correct login). */
export async function forgive(scope: string, extra = ""): Promise<void> {
  hits.delete(`${scope}:${await clientIp()}:${extra.toLowerCase()}`);
}

export const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
