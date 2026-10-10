"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { logoutAction } from "@/app/actions/auth";

const LINKS: [string, string, string][] = [
  ["/account", "Dashboard", "home"],
  ["/account/orders", "Orders", "package"],
  ["/account/wishlist", "Wishlist", "heart"],
  ["/account/addresses", "Addresses", "pin"],
  ["/account/payments", "Payment Methods", "cart"],
  ["/account/notifications", "Notifications", "bell"],
  ["/account/quotes", "Wholesale Requests", "building"],
  ["/account/profile", "Profile", "user"],
];

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const cls = (href: string) =>
    `flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
      pathname === href || (href !== "/account" && pathname.startsWith(href))
        ? "bg-forest text-ivory"
        : "text-forest hover:bg-forest/5"
    }`;
  return (
    <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Account">
      {LINKS.map(([href, label, icon]) => (
        <Link key={href} href={href} className={cls(href)} aria-current={pathname === href || (href !== "/account" && pathname.startsWith(href)) ? "page" : undefined}>
          <Icon name={icon} className="h-4 w-4 text-gold" /> {label}
        </Link>
      ))}
      {isAdmin && <Link href="/admin" className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold text-forest hover:bg-forest/5"><Icon name="chart" className="h-4 w-4 text-gold" /> Admin dashboard</Link>}
      <form action={logoutAction}><button className="flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"><Icon name="logout" className="h-4 w-4" /> Logout</button></form>
    </nav>
  );
}
