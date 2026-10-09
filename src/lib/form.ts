export type FormState = { ok: boolean; message: string; redirect?: string } | null;

export const str = (fd: FormData, key: string): string => (fd.get(key) ?? "").toString().trim();
export const num = (fd: FormData, key: string, fallback = 0): number => {
  const v = Number((fd.get(key) ?? "").toString().replace(/,/g, ""));
  return Number.isFinite(v) ? v : fallback;
};
export const bool = (fd: FormData, key: string): boolean => fd.get(key) === "on" || fd.get(key) === "true";
export const safeNext = (n: string | null | undefined, fallback: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : fallback);
