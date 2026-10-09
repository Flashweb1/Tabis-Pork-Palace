"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProvider";
import { SEARCH_SUGGESTIONS } from "@/lib/search";

type Cat = { slug: string; name: string };

const NAV = [
  { href: "/whole-pigs", label: "Whole Pigs" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/pork-guide", label: "Pork Guide" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header({ categories }: { categories: Cat[] }) {
  const { count, user } = useApp();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isAdmin = user && user.role !== "customer";

  const searchForm = (cls: string, autoFocus = false) => (
    <form action="/search" className={cls} role="search">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest/50" />
      <input
        name="q"
        type="search"
        autoFocus={autoFocus}
        placeholder="Search pork belly, whole pig, 50kg pig…"
        className="w-full rounded-full border border-forest/15 bg-white py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-charcoal/40 focus:border-forest"
        list="search-suggestions"
        aria-label="Search products"
      />
      <datalist id="search-suggestions">
        {SEARCH_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-forest/10 bg-ivory/95 backdrop-blur">
      <div className="hidden bg-forest text-ivory md:block">
        <div className="container-x flex items-center justify-between py-1.5 text-xs">
          <span>Premium pork · chilled delivery across Lagos, Ibadan &amp; Abuja</span>
          <span className="text-gold-2">Delivery availability may vary by location and product type.</span>
        </div>
      </div>
      <div className="container-x flex h-[68px] items-center gap-4 lg:gap-8">
        <button className="md:hidden" aria-label="Menu" onClick={() => setMenu((m) => !m)}>
          <Icon name={menu ? "x" : "menu"} className="h-6 w-6 text-forest" />
        </button>
        <Link href="/" aria-label="Tabis Pork Palace home" className="mr-auto md:mr-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <div className="group relative">
            <Link href="/shop" className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-forest hover:bg-forest/5 ${pathname.startsWith("/shop") || pathname.startsWith("/category") ? "bg-forest/5" : ""}`}>
              Shop <Icon name="down" className="h-3.5 w-3.5" />
            </Link>
            <div className="invisible absolute left-0 top-full w-64 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
              <div className="card p-2">
                <Link href="/shop" className="block rounded-lg px-3 py-2 text-sm font-semibold text-forest hover:bg-forest/5">All Pork</Link>
                {categories.map((c) => (
                  <Link key={c.slug} href={c.slug === "whole-pigs" ? "/whole-pigs" : `/category/${c.slug}`} className="block rounded-lg px-3 py-2 text-sm text-charcoal/80 hover:bg-forest/5">
                    {c.name}
                  </Link>
                ))}
                <Link href="/deals" className="block rounded-lg px-3 py-2 text-sm font-semibold text-gold hover:bg-gold-3">Deals &amp; Offers</Link>
              </div>
            </div>
          </div>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-lg px-3 py-2 text-sm font-semibold text-forest hover:bg-forest/5 ${pathname.startsWith(n.href) ? "bg-forest/5" : ""}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        {searchForm("relative ml-auto hidden w-full max-w-xs lg:block")}
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="grid h-10 w-10 place-items-center rounded-full text-forest hover:bg-forest/5 lg:hidden" aria-label="Search" onClick={() => setSearchOpen((s) => !s)}>
            <Icon name="search" />
          </button>
          <Link href={isAdmin ? "/admin" : "/account"} className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-forest hover:bg-forest/5 md:flex">
            <Icon name="user" className="h-5 w-5" />
            {user ? user.name.split(" ")[0] : "Sign in"}
          </Link>
          <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-full text-forest hover:bg-forest/5" aria-label={`Cart, ${count} items`}>
            <Icon name="cart" />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-white">{count}</span>}
          </Link>
        </div>
      </div>
      {searchOpen && <div className="container-x pb-3 lg:hidden">{searchForm("relative", true)}</div>}
      {menu && (
        <nav className="border-t border-forest/10 bg-ivory md:hidden" aria-label="Mobile">
          <div className="container-x grid gap-1 py-3">
            {[{ href: "/shop", label: "Shop all pork" }, ...categories.map((c) => ({ href: c.slug === "whole-pigs" ? "/whole-pigs" : `/category/${c.slug}`, label: c.name })), { href: "/deals", label: "Deals & Offers" }, ...NAV, { href: "/track", label: "Track order" }, { href: "/contact", label: "Contact" }].map((l) => (
              <Link key={l.href + l.label} href={l.href} onClick={() => setMenu(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-forest hover:bg-forest/5">
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
