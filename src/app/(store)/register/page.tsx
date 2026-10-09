import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { LogoMark } from "@/components/Logo";
import { registerAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center"><LogoMark className="mx-auto h-16 w-auto" /><h1 className="mt-4 font-display text-5xl font-semibold text-forest">Join Tabis</h1><p className="mt-1 text-charcoal/65">Track orders, save addresses and reorder fast</p></div>
        <div className="card p-6 sm:p-8">
          <ActionForm action={registerAction} submit="Create account">
            <input type="hidden" name="next" value={next} />
            <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name" className="input" /></div>
            <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
            <div><label className="label" htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" autoComplete="tel" className="input" placeholder="080…" /></div>
            <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="input" placeholder="At least 8 characters" /></div>
          </ActionForm>
          <p className="mt-5 text-center text-sm text-charcoal/70">Already have an account? <Link href="/login" className="font-semibold text-forest underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
