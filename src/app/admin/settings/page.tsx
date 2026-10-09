import type { Metadata } from "next";
import Link from "next/link";
import { desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { AdminHeader, F, Panel } from "@/components/admin/AdminUi";
import { createStaff, resetStaffPassword, saveSettings, updateStaff } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { ADMIN_ROLES, ROLE_LABEL } from "@/lib/permissions";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = { title: "Settings & staff" };

const DESC: Record<string, string> = {
  super_admin: "Everything",
  operations: "Orders, inventory, whole pigs, delivery",
  sales: "Customers, orders, wholesale, quotes, coupons",
  content: "Products, categories, blog, coupons, reviews",
  finance: "Payments, revenue and reports",
};

export default async function AdminSettings() {
  const me = await requireAdmin("settings");
  const [s, staff, logs] = await Promise.all([getSettings(), db.select().from(users).where(ne(users.role, "customer")), db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(15)]);
  const i = "input !py-2";
  return (
    <div className="space-y-6">
      <AdminHeader title="Settings & staff" />
      <Panel title="Store settings">
        <form action={saveSettings} className="grid gap-4 p-5 sm:grid-cols-2">
          <F label="WhatsApp number (international, digits only)"><input name="whatsapp" defaultValue={s.whatsapp} className={i} /></F>
          <F label="Phone"><input name="phone" defaultValue={s.phone} className={i} /></F>
          <F label="Email"><input name="email" defaultValue={s.email} className={i} /></F>
          <F label="Address"><input name="address" defaultValue={s.address} className={i} /></F>
          <F label="Opening hours" className="sm:col-span-2"><input name="hours" defaultValue={s.hours} className={i} /></F>
          <F label="Bank name"><input name="bank_name" defaultValue={s.bank_name} className={i} /></F>
          <F label="Account name"><input name="bank_account_name" defaultValue={s.bank_account_name} className={i} /></F>
          <F label="Account number"><input name="bank_account_number" defaultValue={s.bank_account_number} className={i} /></F>
          <F label="Pay-on-delivery states (comma separated)"><input name="pod_states" defaultValue={s.pod_states} className={i} /></F>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="low_stock_alerts" defaultChecked={s.low_stock_alerts === "on"} className="h-4 w-4 accent-[#123D27]" /> Notify admins automatically when stock drops below threshold</label>
          <div className="sm:col-span-2"><button className="btn-primary btn-sm">Save settings</button></div>
        </form>
      </Panel>
      <Panel title="Staff & roles">
        <ul className="divide-y divide-forest/10">
          {staff.map((u) => (
            <li key={u.id} className="p-5">
              <form action={updateStaff} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={u.id} />
                <div className="min-w-[200px] flex-1"><p className="font-semibold text-forest">{u.name}{u.id === me.id && <span className="badge ml-2 bg-gold-3 text-[#7a5d22]">You</span>}</p><p className="text-xs text-charcoal/55">{u.email}</p></div>
                <select name="role" defaultValue={u.role} disabled={u.id === me.id} className="input !w-56 !py-2" aria-label="Role">{ADMIN_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}<option value="customer">Customer (revoke access)</option></select>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={u.active} disabled={u.id === me.id} className="h-4 w-4 accent-[#123D27]" /> Active</label>
                {u.id !== me.id && <button className="btn-outline btn-sm">Save</button>}
              </form>
              {u.id !== me.id ? (
                <form action={resetStaffPassword} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <input name="password" type="password" minLength={8} required placeholder="New password (8+ characters)" className="input !w-72 !py-1.5" aria-label={`New password for ${u.name}`} autoComplete="new-password" />
                  <button className="btn-outline btn-sm">Reset password</button>
                </form>
              ) : (
                <Link href="/account/profile" className="mt-3 inline-block text-sm font-semibold text-forest underline">Change your own password</Link>
              )}
            </li>
          ))}
        </ul>
        <form action={createStaff} className="grid gap-3 border-t border-forest/10 bg-forest-3/40 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <F label="Name"><input name="name" required className={i} /></F>
          <F label="Email"><input name="email" type="email" required className={i} /></F>
          <F label="Temporary password"><input name="password" type="password" minLength={8} required className={i} /></F>
          <F label="Role"><select name="role" className={i}>{ADMIN_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></F>
          <div className="flex items-end"><button className="btn-gold btn-sm">Add staff</button></div>
        </form>
        <ul className="grid gap-2 border-t border-forest/10 p-5 text-xs text-charcoal/65 sm:grid-cols-2">{ADMIN_ROLES.map((r) => <li key={r}><strong className="text-forest">{ROLE_LABEL[r]}:</strong> {DESC[r]}</li>)}</ul>
      </Panel>
      <Panel title="Integrations">
        <ul className="grid gap-3 p-5 text-sm sm:grid-cols-2">
          <li className="rounded-lg bg-forest-3/60 p-4"><strong className="text-forest">Paystack</strong><br />{process.env.PAYSTACK_SECRET_KEY ? "Live — secret key configured." : "Demo mode. Set PAYSTACK_SECRET_KEY to accept live payments."}</li>
          <li className="rounded-lg bg-forest-3/60 p-4"><strong className="text-forest">Flutterwave</strong><br />{process.env.FLW_SECRET_KEY ? "Live — secret key configured." : "Demo mode. Set FLW_SECRET_KEY to accept live payments."}</li>
        </ul>
      </Panel>
      <Panel title="Audit log">
        <ul className="divide-y divide-forest/10 text-sm">{logs.map((l) => <li key={l.id} className="flex flex-wrap justify-between gap-2 px-5 py-2.5"><span><strong className="text-forest">{l.actor}</strong> · {l.action} · <span className="text-charcoal/60">{l.entity} {l.detail}</span></span><span className="text-xs text-charcoal/45">{dateTime(l.createdAt)}</span></li>)}</ul>
      </Panel>
    </div>
  );
}
