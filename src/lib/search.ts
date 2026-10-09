import type { ProductView } from "@/lib/store";

const STOP = new Set(["for", "sale", "buy", "the", "a", "an", "of", "in", "to", "nigeria", "and", "with", "my", "need", "want", "fresh", "pork", "kgs", "kg", "price", "cheap", "near", "me", "online"]);
const PIG_WORDS = new Set(["pig", "pigs", "hog", "hogs", "whole", "piglet", "swine"]);
const BULK_WORDS = new Set(["bulk", "wholesale", "carton", "cartons", "business", "restaurant", "caterer", "supply"]);

const stem = (w: string) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);

/** Product-aware search: understands names, cuts, "whole pig", "50kg pig", "bulk pork", etc. */
export function searchProducts(query: string, all: ProductView[]): ProductView[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const weightMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo)/);
  const weight = weightMatch ? Number(weightMatch[1]) : null;
  const raw = q.replace(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?)/g, " ").split(/[^a-z0-9]+/).filter(Boolean);
  const tokens = raw.filter((t) => !STOP.has(t) && !/^\d+$/.test(t)).map(stem);
  const wantsPig = raw.some((t) => PIG_WORDS.has(t)) || (weight !== null && weight >= 20 && raw.some((t) => t === "pig" || t === "pigs"));
  const wantsBulk = raw.some((t) => BULK_WORDS.has(t));
  const phrase = q.replace(/\s+/g, " ");

  const scored = all
    .map((p) => {
      const name = p.name.toLowerCase();
      const hay = `${p.description} ${p.bestFor.join(" ")} ${p.categoryName}`.toLowerCase();
      let score = 0;
      if (name.includes(phrase)) score += 12;
      for (const t of tokens) {
        if (name.includes(t)) score += 6;
        else if (p.slug.includes(t)) score += 4;
        else if (hay.includes(t)) score += 1.5;
        else score -= 0.5;
      }
      if (wantsPig && (p.productType === "whole_pig" || p.productType === "quote_required")) {
        score += 8;
        if (weight !== null && p.pigRange) {
          const [lo, hi] = p.pigRange.endsWith("+") ? [Number(p.pigRange.slice(0, -1)), Infinity] : p.pigRange.split("-").map(Number);
          if (weight >= lo && weight <= hi) score += 10;
        }
      }
      if (wantsBulk) {
        if (p.productType === "bulk") score += 8;
        else if (p.productType === "weight_based") score += 1;
      }
      if (tokens.length === 0 && !wantsPig && !wantsBulk) score = 0;
      return { p, score };
    })
    .filter((x) => x.score > 0.5)
    .sort((a, b) => b.score - a.score || b.p.soldCount - a.p.soldCount);
  return scored.map((x) => x.p);
}

export const SEARCH_SUGGESTIONS = ["pork belly", "whole pig", "50kg pig", "pork ribs", "bulk pork", "sausage"];
