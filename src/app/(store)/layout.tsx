import type { ReactNode } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { AppProvider } from "@/components/AppProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getSession } from "@/lib/auth";
import { ensureSeeded } from "@/lib/bootstrap";
import { getCategories, getSettings, getTiers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  const [user, cats, tiers, settings] = await Promise.all([getSession(), getCategories(), getTiers(), getSettings()]);
  const wishlistIds = user ? (await db.select({ id: wishlists.productId }).from(wishlists).where(eq(wishlists.userId, user.id))).map((r) => r.id) : [];
  return (
    <AppProvider user={user ? { id: user.id, name: user.name, role: user.role } : null} tiers={tiers} whatsapp={settings.whatsapp} wishlistIds={wishlistIds}>
      <Header categories={cats.map((c) => ({ slug: c.slug, name: c.name }))} />
      <main className="min-h-[60vh] pb-16 md:pb-0">{children}</main>
      <Footer settings={settings} />
      <WhatsAppButton number={settings.whatsapp} />
      <MobileNav />
    </AppProvider>
  );
}
