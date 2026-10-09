import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { LogoMark } from "@/components/Logo";
import { loginAction } from "@/app/actions/auth";
import { demoLoginsVisible } from "@/lib/demo";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  const demo = await demoLoginsVisible();
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center"><LogoMark className="mx-auto h-16 w-auto" /><h1 className="mt-4 font-display text-5xl font-semibold text-forest">Welcome back</h1><p className="mt-1 text-charcoal/65">Sign in to your Tabis account</p></div>
        <div className="card p-6 sm:p-8">
          <ActionForm action={loginAction} submit="Sign in">
            <input type="hidden" name="next" value={next} />
            <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
            <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
          </ActionForm>
          <p className="mt-5 text-center text-sm text-charcoal/70">New to Tabis? <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-forest underline">Create an account</Link></p>
        </div>
        {demo && (
        <details className="mt-5 rounded-xl border border-gold/40 bg-gold-3/60 p-4 text-sm text-charcoal/80">
          <summary className="cursor-pointer font-semibold text-forest">Demo access</summary>
          <ul className="mt-2 space-y-1">
            <li><strong>Customer:</strong> samuel@example.com / Customer@123</li>
            <li><strong>Super admin:</strong> admin@tabispork.com / Admin@123</li>
            <li><strong>Staff roles:</strong> ops@ · sales@ · content@ · finance@tabispork.com / Admin@123</li>
          </ul>
        </details>
        )}
      </div>
    </div>
  );
}
