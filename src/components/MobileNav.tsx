"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useApp } from "@/components/AppProvider";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useApp();
  const items = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/shop", label: "Shop", icon: "cart" },
    { href: "/search", label: "Search", icon: "search" },
    { href: user ? "/account/orders" : "/track", label: "Orders", icon: "package" },
    { href: user ? "/account" : "/login", label: "Account", icon: "user" },
  ];
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-forest/10 bg-ivory/97 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Bottom">
      <ul className="grid grid-cols-5">
        {items.map((i) => {
          const active = i.href === "/" ? pathname === "/" : pathname.startsWith(i.href.split("?")[0]);
          return (
            <li key={i.label}>
              <Link href={i.href} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? "text-forest" : "text-charcoal/55"}`}>
                <Icon name={i.icon} className={`h-5 w-5 ${active ? "text-gold" : ""}`} />
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
