import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { Img } from "@/components/Img";
import { PageHero } from "@/components/ui";
import { dateShort } from "@/lib/format";

export const metadata: Metadata = { title: "Blog & Recipes — Pork Guide", description: "Pork recipes, cooking tips, cuts guides and farm updates from Tabis Pork Palace." };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const all = await db.select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.publishedAt));
  const cats = Array.from(new Set(all.map((p) => p.category)));
  const posts = category ? all.filter((p) => p.category === category) : all;
  return (
    <>
      <PageHero eyebrow="Blog" title="Recipes, tips & farm updates" />
      <section className="container-x py-12">
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/blog" className={`rounded-full border px-4 py-2 text-sm font-semibold ${!category ? "border-forest bg-forest text-ivory" : "border-forest/20 text-forest"}`}>All</Link>
          {cats.map((c) => <Link key={c} href={`/blog?category=${encodeURIComponent(c)}`} className={`rounded-full border px-4 py-2 text-sm font-semibold ${category === c ? "border-forest bg-forest text-ivory" : "border-forest/20 text-forest"}`}>{c}</Link>)}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="card group overflow-hidden">
              <div className="aspect-[16/10] overflow-hidden bg-forest-3"><Img src={p.image} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
              <div className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-gold">{p.category} · {dateShort(p.publishedAt)}</p><h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-forest">{p.title}</h2><p className="mt-2 line-clamp-3 text-sm text-charcoal/70">{p.excerpt}</p></div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
