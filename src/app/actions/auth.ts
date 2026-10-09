"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { TOO_MANY, allow, forgive } from "@/lib/ratelimit";
import { safeNext, str, type FormState } from "@/lib/form";

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const next = str(fd, "next");
  if (!email || !password) return { ok: false, message: "Enter your email and password." };
  // Brute-force protection: per device overall, and per device + account.
  if (!(await allow("login-ip", 40, 15 * 60_000)) || !(await allow("login", 8, 15 * 60_000, email))) return { ok: false, message: TOO_MANY };
  const u = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
  if (!u || !u.active || !verifyPassword(password, u.passwordHash)) return { ok: false, message: "Incorrect email or password." };
  await forgive("login", email);
  await createSession(u.id);
  const admin = isAdminRole(u.role);
  const dest = admin ? safeNext(next, "/admin") : next.startsWith("/admin") ? "/account" : safeNext(next, "/account");
  return { ok: true, message: `Welcome back, ${u.name.split(" ")[0]}!`, redirect: dest };
}

export async function registerAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const phone = str(fd, "phone");
  const password = str(fd, "password");
  const next = str(fd, "next");
  if (!(await allow("register", 10, 60 * 60_000))) return { ok: false, message: TOO_MANY };
  if (name.length < 2) return { ok: false, message: "Please enter your full name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Please enter a valid email address." };
  if (password.length < 8) return { ok: false, message: "Password must be at least 8 characters." };
  const exists = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.email, email));
  if (exists[0].n > 0) return { ok: false, message: "An account with this email already exists. Try signing in." };
  const [u] = await db.insert(users).values({ name, email, phone, passwordHash: hashPassword(password), role: "customer" }).returning();
  await createSession(u.id);
  return { ok: true, message: "Account created — welcome to Tabis!", redirect: safeNext(next, "/account") };
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
