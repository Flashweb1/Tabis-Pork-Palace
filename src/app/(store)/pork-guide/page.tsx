import type { Metadata } from "next";
import { CutExplorer } from "@/components/CutExplorer";
import { PageHero } from "@/components/ui";
import { CUTS } from "@/lib/guide";

export const metadata: Metadata = {
  title: "Know Your Pork — Pork Cuts Guide",
  description: "An interactive guide to pork cuts: shoulder, belly, loin, ribs, leg, chops and more — what each is best for and how to cook it.",
};

export default function PorkGuidePage() {
  return (
    <>
      <PageHero eyebrow="Pork guide" title="Know your pork" sub="Not sure which cut to buy? Explore the pig, see what each cut is best for and how to cook it." />
      <section className="container-x py-14">
        <CutExplorer cuts={CUTS} slugs={Object.fromEntries(CUTS.map((c) => [c.id, c.product]))} />
      </section>
    </>
  );
}
