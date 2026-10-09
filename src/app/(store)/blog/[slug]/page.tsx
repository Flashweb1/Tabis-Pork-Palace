import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { Img } from "@/components/Img";
import { Prose } from "@/components/Prose";
import { dateShort } from "@/lib/format";

async function load(slug: string) {
  return (await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true))).limit(1))[0];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await load(slug);
  return p ? { title: p.title, description: p.excerpt, openGraph: { images: p.image ? [p.image] : [] } } : {};
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();
  return (
    <article className="container-x max-w-3xl py-12">
      <Link href="/blog" className="text-sm font-semibold text-forest hover:underline">← All articles</Link>
      <p className="eyebrow mt-6">{p.category} · {dateShort(p.publishedAt)}</p>
      <h1 className="mt-2 font-display text-5xl font-semibold leading-[1.02] text-forest sm:text-6xl">{p.title}</h1>
      <div className="mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-forest-3"><Img src={p.image} alt={p.title} className="h-full w-full object-cover" /></div>
      <p className="mt-8 text-xl leading-relaxed text-charcoal/80">{p.excerpt}</p>
      <div className="mt-6"><Prose text={p.content} /></div>
      <div className="mt-10 rounded-xl bg-forest p-6 text-ivory"><p className="font-display text-3xl font-semibold">Ready to cook?</p><Link href="/shop" className="btn-gold mt-4">Shop fresh pork</Link></div>
    </article>
  );
}
