import type { Metadata } from "next";
import type { ReactNode } from "react";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/bootstrap";
import { ADMIN_NAV, ROLE_LABEL, can } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Tabis Admin", template: "%s | Tabis Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  const user = await requireAdmin();
  const unread = (await db.select({ n: sql<number>`count(*)::int` }).from(notifications).where(and(isNull(notifications.userId), eq(notifications.read, false))))[0].n;
  const items = ADMIN_NAV.filter((n) => can(user.role, n.section)).map((n) => ({ label: n.label, href: n.href }));
  return (
    <div className="min-h-screen bg-[#f1eee6] lg:flex">
      <AdminSidebar items={items} userName={user.name} role={ROLE_LABEL[user.role] ?? user.role} unread={unread} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
