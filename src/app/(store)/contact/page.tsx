import type { Metadata } from "next";
import { ActionForm } from "@/components/ActionForm";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/ui";
import { submitContact } from "@/app/actions/shop";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = { title: "Contact Tabis" };

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero eyebrow="Contact" title="We're here to help" sub="Wholesale, big pigs, custom cuts, delivery questions — talk to a real person." />
      <section className="container-x grid gap-10 py-16 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#1fa855] text-white"><Icon name="chat" fill /></span><div><p className="font-display text-2xl font-semibold text-forest">Chat on WhatsApp</p><p className="text-sm text-charcoal/65">Fastest way to reach us</p></div></a>
          {[["phone", "Call", s.phone], ["mail", "Email", s.email], ["pin", "Visit", s.address]].map(([i, t, v]) => (
            <div key={t} className="card flex items-center gap-4 p-5"><span className="grid h-12 w-12 place-items-center rounded-full bg-forest text-gold-2"><Icon name={i} /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-gold">{t}</p><p className="font-semibold text-charcoal">{v}</p></div></div>
          ))}
          <p className="text-sm text-charcoal/65">Hours: {s.hours}</p>
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="font-display text-3xl font-semibold text-forest">Send us a message</h2>
          <ActionForm action={submitContact} submit="Send message" className="mt-5 space-y-4" resetOnSuccess>
            <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" required className="input" /></div>
            <div><label className="label" htmlFor="contact">Email or phone</label><input id="contact" name="contact" required className="input" /></div>
            <div><label className="label" htmlFor="message">Message</label><textarea id="message" name="message" rows={5} required className="input" /></div>
          </ActionForm>
        </div>
      </section>
    </>
  );
}
