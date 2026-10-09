"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { lineTotal, type Tier } from "@/lib/pricing";
import { getCartSnapshot, toggleWishlist } from "@/app/actions/shop";
import { reconcileCart } from "@/lib/cart";

export type CartItem = {
  key: string;
  productId: number;
  slug: string;
  name: string;
  image: string;
  unit: string;
  productType: string;
  price: number;
  salePrice: number | null;
  minOrder: number;
  maxOrder: number | null;
  qty: number;
  options: Record<string, string>;
};

type AppUser = { id: number; name: string; role: string } | null;

type Ctx = {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  lineOf: (item: CartItem) => number;
  tiers: Tier[];
  user: AppUser;
  whatsapp: string;
  wishlist: Set<number>;
  toggleWish: (id: number) => Promise<void>;
  toast: (msg: string) => void;
  notices: string[];
  syncCart: (current: CartItem[]) => Promise<void>;
  clearNotices: () => void;
};

const AppCtx = createContext<Ctx | null>(null);
const STORAGE = "tp_cart_v1";

export function AppProvider({
  children,
  user,
  tiers,
  whatsapp,
  wishlistIds,
}: {
  children: ReactNode;
  user: AppUser;
  tiers: Tier[];
  whatsapp: string;
  wishlistIds: number[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set(wishlistIds));
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [notices, setNotices] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    setWishlist(new Set(wishlistIds));
  }, [wishlistIds]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const add = useCallback(
    (item: Omit<CartItem, "key">) => {
      const key = `${item.productId}|${JSON.stringify(item.options)}`;
      setItems((prev) => {
        const found = prev.find((p) => p.key === key);
        if (found) {
          const max = item.maxOrder ?? Infinity;
          return prev.map((p) => (p.key === key ? { ...p, qty: Math.min(max, Math.round((p.qty + item.qty) * 100) / 100) } : p));
        }
        return [...prev, { ...item, key }];
      });
      toast(`${item.name} added to cart`);
    },
    [toast],
  );

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => prev.map((p) => (p.key === key ? { ...p, qty: Math.max(p.minOrder || 0.5, Math.round(qty * 100) / 100) } : p)));
  }, []);
  const remove = useCallback((key: string) => setItems((prev) => prev.filter((p) => p.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);
  const lineOf = useCallback((item: CartItem) => lineTotal(item, item.qty, tiers, item.options), [tiers]);

  const syncCart = useCallback(async (current: CartItem[]) => {
    if (!current.length) return;
    try {
      const snaps = await getCartSnapshot(current.map((i) => i.productId));
      const map = new Map(snaps.map((x) => [x.id, x]));
      setNotices(reconcileCart(current, map).notices);
      setItems((prev) => reconcileCart(prev, map).items);
    } catch {
      /* offline or transient — keep the cart as it is */
    }
  }, []);
  const clearNotices = useCallback(() => setNotices([]), []);

  const toggleWish = useCallback(
    async (id: number) => {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setWishlist((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
      const res = await toggleWishlist(id);
      if (res.ok) toast(res.added ? "Saved to wishlist" : "Removed from wishlist");
    },
    [user, router, toast],
  );

  const value = useMemo<Ctx>(
    () => ({
      items,
      ready,
      count: items.length,
      subtotal: items.reduce((a, i) => a + lineTotal(i, i.qty, tiers, i.options), 0),
      add,
      setQty,
      remove,
      clear,
      lineOf,
      tiers,
      user,
      whatsapp,
      wishlist,
      toggleWish,
      toast,
      notices,
      syncCart,
      clearNotices,
    }),
    [items, ready, add, setQty, remove, clear, lineOf, tiers, user, whatsapp, wishlist, toggleWish, toast, notices, syncCart, clearNotices],
  );

  return (
    <AppCtx.Provider value={value}>
      {children}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-forest px-5 py-3 text-sm font-medium text-ivory shadow-xl md:bottom-8" role="status">
          ✓ {toastMsg}
        </div>
      )}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}
