import { sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

let started: Promise<void> | null = null;

/** Seeds demo data once per server process if the catalogue is empty. */
export function ensureSeeded(): Promise<void> {
  if (!started) {
    started = (async () => {
      try {
        const r = await db.select({ n: sql<number>`count(*)::int` }).from(products);
        if (r[0].n === 0) {
          const { seedDatabase } = await import("@/db/seed-data");
          await seedDatabase();
        }
      } catch (e) {
        console.error("ensureSeeded failed", e);
        started = null;
      }
    })();
  }
  return started;
}
