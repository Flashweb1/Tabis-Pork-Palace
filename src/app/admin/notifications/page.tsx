import type { Metadata } from "next";
import Link from "next/link";
import { desc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { AdminHeader, Panel } from "@/components/admin/AdminUi";
import { markAdminNotificationsRead } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { dateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

export default async function AdminNotifications() {
  await requireAdmin("notifications");
  const list = await db.select().from(notifications).where(isNull(notifications.userId)).orderBy(desc(notifications.createdAt)).limit(100);
  return (
    <div>
      <AdminHeader title="Notifications" sub="New orders, payments, low-stock alerts, quote requests, reviews and contact messages." actions={<form action={markAdminNotificationsRead}><button className="btn-outline btn-sm">Mark all read</button></form>} />
      <Panel>
        <ul className="divide-y divide-forest/10">
          {list.map((n) => (
            <li key={n.id} className={`flex gap-3 px-5 py-4 ${n.read ? "" : "bg-gold-3/40"}`}>
              <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-forest/20" : "bg-gold"}`} />
              <div className="min-w-0"><p className="font-semibold text-forest">{n.link ? <Link href={n.link} className="hover:underline">{n.title}</Link> : n.title}</p><p className="text-sm text-charcoal/70">{n.body}</p><p className="mt-1 text-xs text-charcoal/45">{dateTime(n.createdAt)}</p></div>
            </li>
          ))}
          {list.length === 0 && <li className="p-8 text-center text-charcoal/55">Nothing yet.</li>}
        </ul>
      </Panel>
    </div>
  );
}
