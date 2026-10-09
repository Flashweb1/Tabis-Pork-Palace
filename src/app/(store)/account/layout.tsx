import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";

const LINKS = [
  ["/account", "Dashboard", "home"],
  ["/account/orders", "Orders", "package"],
  ["/account/wishlist", "Wishlist", "heart"],
  ["/account/addresses", "Addresses", "pin"],
  ["/account/payments", "Payment Methods", "cart"],
  ["/account/notifications", "Notifications", "bell"],
  ["/account/quotes", "Wholesale Requests", "building"],
  ["/account/profile", "Profile", "user"],
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("/account");
  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[250px_1fr]">
      <aside>
        <div className="card p-4">
          <p className="px-2 pb-3 font-display text-2xl font-semibold text-forest">{user.name}</p>
          <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Account">
            {LINKS.map(([href, label, icon]) => (
              <Link key={href} href={href} className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold text-forest hover:bg-forest/5">
                <Icon name={icon} className="h-4 w-4 text-gold" /> {label}
              </Link>
            ))}
            {isAdminRole(user.role) && <Link href="/admin" className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold text-forest hover:bg-forest/5"><Icon name="chart" className="h-4 w-4 text-gold" /> Admin dashboard</Link>}
            <form action={logoutAction}><button className="flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"><Icon name="logout" className="h-4 w-4" /> Logout</button></form>
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
