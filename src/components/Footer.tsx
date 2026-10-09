import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { subscribeNewsletter } from "@/app/actions/shop";

export function Footer({ settings }: { settings: Record<string, string> }) {
  const col = (title: string, links: [string, string][]) => (
    <div>
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold-2">{title}</h4>
      <ul className="space-y-2.5 text-sm text-ivory/75">
        {links.map(([href, label]) => (
          <li key={href + label}>
            <Link href={href} className="hover:text-ivory hover:underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="mt-24 bg-forest text-ivory">
      <div className="container-x py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory/75">
              Premium Pork. Exceptional Quality. Delivered Fresh. Retail cuts, family packs, whole pigs and wholesale supply for Nigerian homes and businesses.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ivory/80">
              <li className="flex items-center gap-2"><Icon name="phone" className="h-4 w-4 text-gold-2" /> {settings.phone}</li>
              <li className="flex items-center gap-2"><Icon name="mail" className="h-4 w-4 text-gold-2" /> {settings.email}</li>
              <li className="flex items-center gap-2"><Icon name="pin" className="h-4 w-4 text-gold-2" /> {settings.address}</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {col("Shop", [["/shop", "All pork"], ["/category/fresh-pork", "Fresh pork"], ["/category/pork-cuts", "Pork cuts"], ["/category/pork-packages", "Packages"], ["/whole-pigs", "Whole pigs"], ["/deals", "Deals"]])}
            {col("Business", [["/wholesale", "Tabis Business"], ["/quote", "Request a quote"], ["/category/bulk-orders", "Bulk orders"], ["/delivery", "Delivery"]])}
            {col("Learn", [["/pork-guide", "Know your pork"], ["/blog", "Blog & recipes"], ["/farm", "Farm to table"], ["/quality", "Quality & freshness"], ["/how-it-works", "How it works"]])}
            {col("Help", [["/track", "Track order"], ["/faq", "FAQ"], ["/contact", "Contact"], ["/about", "About us"], ["/account", "My account"]])}
          </div>
        </div>
        <div className="mt-12 grid gap-6 rounded-xl border border-ivory/15 bg-white/5 p-6 md:grid-cols-2 md:items-center">
          <div>
            <h4 className="font-display text-2xl font-semibold">Offers, recipes &amp; farm updates</h4>
            <p className="mt-1 text-sm text-ivory/70">Join our newsletter. No spam — just good pork.</p>
          </div>
          <ActionForm action={subscribeNewsletter} submit="Subscribe" className="flex flex-col gap-2 sm:flex-row" buttonClass="btn-gold sm:w-auto" resetOnSuccess>
            <input name="email" type="email" required placeholder="you@email.com" className="input flex-1 !border-ivory/20 !bg-white/10 !text-ivory placeholder:!text-ivory/50" aria-label="Email address" />
          </ActionForm>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-ivory/15 pt-6 text-xs text-ivory/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Tabis Pork Palace. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li><Link href="/legal/privacy" className="hover:text-ivory">Privacy Policy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-ivory">Terms</Link></li>
            <li><Link href="/legal/refunds" className="hover:text-ivory">Refund Policy</Link></li>
            <li><Link href="/legal/delivery-policy" className="hover:text-ivory">Delivery Policy</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
