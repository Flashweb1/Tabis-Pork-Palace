import type { ReactNode } from "react";
import { isAdminRole } from "@/lib/permissions";
import { requireUser } from "@/lib/auth";
import { AccountNav } from "@/components/AccountNav";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("/account");
  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[250px_1fr]">
      <aside>
        <div className="card p-4">
          <p className="px-2 pb-3 font-display text-2xl font-semibold text-forest">{user.name}</p>
          <AccountNav isAdmin={isAdminRole(user.role)} />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
