"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/app/actions/auth";

type Item = { label: string; href: string };

export function AdminSidebar({ items, userName, role, unread }: { items: Item[]; userName: string; role: string; unread: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Admin">
      {items.map((i) => {
        const active = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-gold text-white" : "text-ivory/80 hover:bg-white/10 hover:text-white"}`}>
            {i.label}
            {i.href === "/admin/notifications" && unread > 0 && <span className="rounded-full bg-white px-2 text-xs font-bold text-forest">{unread}</span>}
          </Link>
        );
      })}
    </nav>
  );
  const foot = (
    <div className="border-t border-white/10 p-4 text-sm text-ivory/80">
      <p className="font-semibold text-white">{userName}</p>
      <p className="text-xs text-gold-2">{role}</p>
      <div className="mt-3 flex gap-2">
        <Link href="/" className="btn-ghost-light btn-sm flex-1">View store</Link>
        <form action={logoutAction}><button className="btn-ghost-light btn-sm" aria-label="Log out"><Icon name="logout" className="h-4 w-4" /></button></form>
      </div>
    </div>
  );
  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-forest px-4 py-3 text-ivory lg:hidden">
        <Logo light className="[&_svg]:h-8" />
        <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu"><Icon name={open ? "x" : "menu"} className="h-6 w-6" /></button>
      </div>
      {open && <div className="fixed inset-0 z-30 flex flex-col overflow-y-auto bg-forest pt-14 lg:hidden">{nav}{foot}</div>}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col bg-forest lg:flex">
        <div className="border-b border-white/10 px-5 py-5"><Logo light /><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-2">Admin</p></div>
        {nav}
        {foot}
      </aside>
    </>
  );
}
