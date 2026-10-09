import { ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";

export const DEFAULT_STAFF_PASSWORD = "Admin@123";

let cache: { at: number; emails: string[] } | null = null;

/** Staff accounts that still use the seeded demo password (cached for 30s; scrypt is deliberately slow). */
export async function weakStaffEmails(): Promise<string[]> {
  if (cache && Date.now() - cache.at < 30_000) return cache.emails;
  let emails: string[] = [];
  try {
    const rows = await db.select({ email: users.email, hash: users.passwordHash }).from(users).where(ne(users.role, "customer"));
    emails = rows.filter((r) => verifyPassword(DEFAULT_STAFF_PASSWORD, r.hash)).map((r) => r.email);
  } catch {
    // database unavailable — treat as "nothing to warn about"
  }
  cache = { at: Date.now(), emails };
  return emails;
}

/** The public "Demo access" box on the login page hides itself once the admin password has been changed. */
export async function demoLoginsVisible(): Promise<boolean> {
  return (await weakStaffEmails()).includes("admin@tabispork.com");
}

export function resetDemoCache() {
  cache = null;
}
