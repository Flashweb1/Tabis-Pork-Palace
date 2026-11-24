"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProvider";
import { SEARCH_SUGGESTIONS } from "@/lib/search";

type Cat = { slug: string; name: string };
type MenuLink = { href: string; label: string };

const NAV: MenuLink[] = [
  { href: "/whole-pigs", label: "Whole Pigs" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/pork-guide", label: "Pork Guide" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** One column of the mobile menu; wraps into 2 columns on phones, 3 on tablets. */
function MenuGroup({ title, links, onNavigate }: { title: string; links: MenuLink[]; onNavigate: () => void }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 px-3 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold">{title}</p>
      <div className="grid gap-0.5">
        {links.map((l) => (
          <Link
            key={`${l.href}-${l.label}`}
            href={l.href}
            onClick={onNavigate}
            className="block truncate rounded-lg px-3 py-2 text-sm font-semibold text-forest hover:bg-forest/5"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Header({ categories }: { categories: Cat[] }) {
  const { count, user } = useApp();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAdmin = user && user.role !== "customer";

  const closeMenus = () => {
    setMenu(false);
    setSearchOpen(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes whichever panel is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shopLinks: MenuLink[] = [
    { href: "/shop", label: "All Pork" },
    ...categories.map((c) => ({
      href: c.slug === "whole-pigs" ? "/whole-pigs" : `/category/${c.slug}`,
      label: c.name,
    })),
    { href: "/deals", label: "Deals & Offers" },
  ];
  const accountLinks: MenuLink[] = [
    { href: "/track", label: "Track order" },
    { href: isAdmin ? "/admin" : user ? "/account" : "/login", label: user ? "My account" : "Sign in" },
    { href: "/search", label: "Search products" },
  ];

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
    <header className={`site-header sticky top-0 z-50 border-b border-forest/10 bg-ivory/95 backdrop-blur ${scrolled ? "is-scrolled" : ""}`}>
      <div className="hidden bg-forest text-ivory md:block">
        <div className="container-x flex items-center justify-between gap-4 py-1.5 text-[0.7rem] lg:text-xs">
          <span className="truncate">Premium pork · chilled delivery across Lagos, Ibadan &amp; Abuja</span>
          <span className="hidden shrink-0 text-gold-2 lg:inline">Delivery availability may vary by location and product type.</span>
        </div>
      </div>

      <div className="container-x flex h-[68px] items-center gap-2 sm:gap-3 lg:gap-6">
        <button
          type="button"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-forest hover:bg-forest/5 sm:h-10 sm:w-10 lg:hidden"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          aria-controls="mobile-menu"
          onClick={() => {
            setMenu((m) => !m);
            setSearchOpen(false);
          }}
        >
          <Icon name={menu ? "x" : "menu"} className="h-6 w-6 text-forest" />
        </button>

        <Link href="/" aria-label="Tabis Pork Palace home" onClick={closeMenus} className="min-w-0 shrink">
          <Logo />
        </Link>

        <nav className="hidden min-w-0 items-center gap-0.5 lg:flex" aria-label="Main">
          <div className="group relative">
            <Link href="/shop" className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-2 text-[0.8rem] font-semibold text-forest hover:bg-forest/5 xl:px-2.5 xl:text-sm ${pathname.startsWith("/shop") || pathname.startsWith("/category") ? "bg-forest/5" : ""}`}>
              Shop <Icon name="down" className="h-3.5 w-3.5" />
            </Link>
            <div className="invisible absolute left-0 top-full z-10 w-64 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 focus-within:visible focus-within:opacity-100">
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
            <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-lg px-2 py-2 text-[0.8rem] font-semibold text-forest hover:bg-forest/5 xl:px-2.5 xl:text-sm ${pathname.startsWith(n.href) ? "bg-forest/5" : ""}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        {searchForm("relative ml-auto hidden w-full max-w-[280px] xl:block")}

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2 xl:ml-0">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full text-forest hover:bg-forest/5 sm:h-10 sm:w-10 xl:hidden"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((s) => !s);
              setMenu(false);
            }}
          >
            <Icon name="search" />
          </button>
          <Link href={isAdmin ? "/admin" : "/account"} onClick={closeMenus} className="hidden items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-forest hover:bg-forest/5 lg:flex">
            <Icon name="user" className="h-5 w-5" />
            <span className="hidden xl:inline">{user ? user.name.split(" ")[0] : "Sign in"}</span>
          </Link>
          <Link href="/cart" onClick={closeMenus} className="relative grid h-9 w-9 place-items-center rounded-full text-forest hover:bg-forest/5 sm:h-10 sm:w-10" aria-label={`Cart, ${count} items`}>
            <Icon name="cart" />
            {count > 0 && <span key={count} className="badge-pop absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-white">{count}</span>}
          </Link>
        </div>
      </div>

      {searchOpen && <div className="container-x pb-3 xl:hidden">{searchForm("relative", true)}</div>}

      {menu && (
        <nav id="mobile-menu" className="border-t border-forest/10 bg-ivory lg:hidden" aria-label="Mobile">
          <div className="container-x max-h-[calc(100vh-68px)] overflow-y-auto overscroll-contain py-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3 md:gap-x-6">
              <MenuGroup title="Shop" links={shopLinks} onNavigate={closeMenus} />
              <MenuGroup title="Explore" links={[{ href: "/", label: "Home" }, ...NAV]} onNavigate={closeMenus} />
              <MenuGroup title="Your account" links={accountLinks} onNavigate={closeMenus} />
            </div>
            <p className="mt-5 border-t border-forest/10 pt-4 text-xs text-charcoal/55">Premium pork · chilled delivery across Lagos, Ibadan &amp; Abuja</p>
          </div>
        </nav>
      )}
    </header>
  );
}
