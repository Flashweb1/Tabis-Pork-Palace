import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ivory px-6 text-center">
      <div>
        <LogoMark className="mx-auto h-20 w-auto" />
        <p className="eyebrow mt-6">404</p>
        <h1 className="mt-2 font-display text-6xl font-semibold text-forest">This cut isn&apos;t on the menu</h1>
        <p className="mt-3 text-charcoal/65">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-6 flex justify-center gap-3"><Link href="/" className="btn-primary">Go home</Link><Link href="/shop" className="btn-outline">Shop pork</Link></div>
      </div>
    </div>
  );
}
