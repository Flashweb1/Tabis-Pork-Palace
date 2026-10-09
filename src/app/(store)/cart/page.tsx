import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = { title: "Your Cart" };

export default function CartPage() {
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-5xl font-semibold text-forest">Your Cart</h1>
      <CartView />
    </div>
  );
}
