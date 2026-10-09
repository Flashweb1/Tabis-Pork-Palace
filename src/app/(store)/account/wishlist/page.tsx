import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { ProductCard } from "@/components/ProductCard";
import { requireUser } from "@/lib/auth";
import { getAllProducts } from "@/lib/store";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const ids = new Set((await db.select({ id: wishlists.productId }).from(wishlists).where(eq(wishlists.userId, user.id))).map((r) => r.id));
  const items = (await getAllProducts()).filter((p) => ids.has(p.id));
  return (
    <div>
      <h1 className="font-display text-5xl font-semibold text-forest">Wishlist</h1>
      {items.length === 0 ? (
        <div className="card mt-6 p-8 text-charcoal/65">Nothing saved yet. Tap the heart on any product to save it here. <Link href="/shop" className="font-semibold text-forest underline">Browse the shop</Link></div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
