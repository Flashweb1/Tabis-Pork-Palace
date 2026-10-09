import type { Metadata } from "next";
import { ActionForm } from "@/components/ActionForm";
import { changePassword, updateProfile } from "@/app/actions/shop";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  return (
    <div>
      <h1 className="font-display text-5xl font-semibold text-forest">Profile</h1>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-2xl font-semibold text-forest">Your details</h2>
          <ActionForm action={updateProfile} submit="Save changes" className="mt-4 space-y-3">
            <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" defaultValue={user.name} required className="input" /></div>
            <div><label className="label" htmlFor="email">Email</label><input id="email" value={user.email} disabled className="input opacity-60" /></div>
            <div><label className="label" htmlFor="phone">Phone</label><input id="phone" name="phone" defaultValue={user.phone ?? ""} className="input" /></div>
          </ActionForm>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-2xl font-semibold text-forest">Change password</h2>
          <ActionForm action={changePassword} submit="Update password" className="mt-4 space-y-3" resetOnSuccess>
            <div><label className="label" htmlFor="current">Current password</label><input id="current" name="current" type="password" required autoComplete="current-password" className="input" /></div>
            <div><label className="label" htmlFor="next">New password</label><input id="next" name="next" type="password" minLength={8} required autoComplete="new-password" className="input" /></div>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
