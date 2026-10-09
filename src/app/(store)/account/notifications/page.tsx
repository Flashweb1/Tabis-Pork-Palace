import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { markNotificationsRead } from "@/app/actions/shop";
import { requireUser } from "@/lib/auth";
import { dateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/account/notifications");
  const list = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(50);
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="font-display text-5xl font-semibold text-forest">Notifications</h1>{list.some((n) => !n.read) && <form action={markNotificationsRead}><button className="btn-outline btn-sm">Mark all read</button></form>}</div>
      <ul className="card mt-6 divide-y divide-forest/10">
        {list.length === 0 && <li className="p-6 text-charcoal/60">No notifications yet. Order updates appear here (email, SMS and WhatsApp updates can be connected by the Tabis team).</li>}
        {list.map((n) => (
          <li key={n.id} className={`flex gap-3 p-4 ${n.read ? "" : "bg-gold-3/40"}`}>
            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-forest/20" : "bg-gold"}`} />
            <div><p className="font-semibold text-forest">{n.link ? <Link href={n.link} className="hover:underline">{n.title}</Link> : n.title}</p><p className="text-sm text-charcoal/70">{n.body}</p><p className="mt-1 text-xs text-charcoal/45">{dateTime(n.createdAt)}</p></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
