"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { getReorderItems } from "@/app/actions/shop";

export function ReorderButton({ orderId }: { orderId: number }) {
  const app = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function go() {
    setBusy(true);
    setMsg("");
    try {
      const { items, skipped } = await getReorderItems(orderId);
      if (!items.length) {
        setMsg("None of the items in this order are available right now.");
        setBusy(false);
        return;
      }
      for (const i of items) {
        app.add({
          productId: i.id, slug: i.slug, name: i.name, image: i.image, unit: i.unit, productType: i.productType,
          price: i.price, salePrice: i.salePrice, minOrder: i.minOrder > 0 ? i.minOrder : 1, maxOrder: i.maxOrder,
          qty: i.qty, options: i.options,
        });
      }
      if (skipped.length) app.toast(`${skipped.length} item${skipped.length === 1 ? " was" : "s were"} unavailable and skipped`);
      router.push("/cart");
    } catch {
      setMsg("Couldn't add these items. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={go} disabled={busy} className="btn-primary btn-sm">
        {busy ? "Adding…" : "Buy again"}
      </button>
      {msg && <p className="mt-2 text-xs text-red-600">{msg}</p>}
    </div>
  );
}
