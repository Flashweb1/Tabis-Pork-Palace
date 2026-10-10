import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { ActionForm } from "@/components/ActionForm";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/app/actions/shop";
import { requireUser } from "@/lib/auth";
import { NIGERIAN_STATES } from "@/lib/format";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const user = await requireUser("/account/addresses");
  const { edit } = await searchParams;
  const list = await db.select().from(addresses).where(eq(addresses.userId, user.id));
  const editing = list.find((a) => a.id === Number(edit)) ?? null;
  return (
    <div>
      <h1 className="font-display text-5xl font-semibold text-forest">Addresses</h1>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          {list.length === 0 && <p className="card p-6 text-charcoal/60">No saved addresses yet.</p>}
          {list.map((a) => (
            <div key={a.id} className="card flex items-start justify-between gap-4 p-5">
              <div><p className="font-semibold text-forest">{a.label} {a.isDefault && <span className="badge ml-2 bg-gold-3 text-[#7a5d22]">Default</span>}</p><p className="mt-1 text-sm text-charcoal/75">{a.address}</p><p className="text-sm text-charcoal/60">{a.city} {a.state} · {a.phone}</p></div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Link href={`/account/addresses?edit=${a.id}`} className="text-sm font-semibold text-forest hover:underline">Edit</Link>
                {!a.isDefault && <form action={setDefaultAddress}><input type="hidden" name="id" value={a.id} /><button className="text-sm font-semibold text-gold-2 hover:underline">Make default</button></form>}
                <form action={deleteAddress}><input type="hidden" name="id" value={a.id} /><button className="text-sm font-semibold text-red-600 hover:underline">Remove</button></form>
              </div>
            </div>
          ))}
        </div>
        <div className="card h-fit p-6">
          <h2 className="font-display text-2xl font-semibold text-forest">{editing ? "Edit address" : "Add an address"}</h2>
          <ActionForm key={editing?.id ?? "new"} action={saveAddress} submit={editing ? "Save changes" : "Save address"} className="mt-4 space-y-3">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="label">Label</label><input id="label" name="label" defaultValue={editing?.label ?? "Home"} className="input" /></div>
              <div><label className="label" htmlFor="phone">Phone</label><input id="phone" name="phone" defaultValue={editing?.phone ?? ""} className="input" /></div>
            </div>
            <div><label className="label" htmlFor="address">Street address</label><input id="address" name="address" defaultValue={editing?.address ?? ""} required className="input" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="city">City / area</label><input id="city" name="city" defaultValue={editing?.city ?? ""} className="input" /></div>
              <div><label className="label" htmlFor="state">State</label><select id="state" name="state" defaultValue={editing?.state || "Lagos"} className="input">{NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDefault" defaultChecked={editing?.isDefault ?? false} className="h-4 w-4 accent-[#123D27]" /> Make default</label>
            {editing && <Link href="/account/addresses" className="inline-block text-sm font-semibold text-forest hover:underline">Cancel — add new instead</Link>}
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
