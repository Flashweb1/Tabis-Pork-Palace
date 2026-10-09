import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prose } from "@/components/Prose";
import { PageHero } from "@/components/ui";
import { LEGAL } from "@/lib/guide";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: LEGAL[slug]?.title ?? "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = LEGAL[slug];
  if (!doc) notFound();
  return (
    <>
      <PageHero eyebrow="Legal" title={doc.title} />
      <section className="container-x max-w-3xl py-14"><Prose text={doc.body} /></section>
    </>
  );
}
