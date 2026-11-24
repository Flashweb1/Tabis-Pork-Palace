import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import { SUPABASE_ROOT_CA_2021 } from "@/db/supabase-ca";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPglite?: PGlite;
  __arenaNextJsPgliteReady?: Promise<void>;
};

export const isLocalDatabase = databaseUrl.startsWith("pglite://");

let localPglite: PGlite | undefined;

if (isLocalDatabase) {
  localPglite =
    globalForDb.__arenaNextJsPglite ??
    new PGlite("memory://");

  globalForDb.__arenaNextJsPglite = localPglite;

  // Apply the generated drizzle migrations so the local database always matches
  // the schema (drizzle/0000_init.sql). Catalogue data is seeded afterwards by
  // ensureSeeded() in src/lib/bootstrap.ts. The promise is kept on globalThis so
  // every bundled copy of this module waits on the same initialization.
  globalForDb.__arenaNextJsPgliteReady ??= (async () => {
    await localPglite!.waitReady;
    await migrate(drizzlePglite(localPglite!), { migrationsFolder: "./drizzle" });
  })();
}

/**
 * Supabase's chain is signed by a private CA, which Node does not trust. pg 8.20
 * treats sslmode=require as full verification, so pass the pinned root CA and
 * remove sslmode from the URL (it would override the explicit ssl config).
 */
function remotePoolConfig(url: string): PoolConfig {
  const parsed = new URL(url);
  if (parsed.hostname.endsWith(".supabase.com")) {
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("uselibpqcompat");
    return { connectionString: parsed.toString(), ssl: { ca: SUPABASE_ROOT_CA_2021 } };
  }
  return { connectionString: url };
}

const remotePool = isLocalDatabase
  ? undefined
  : (globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool(remotePoolConfig(databaseUrl)));

if (!isLocalDatabase && process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = remotePool;
}

/** Only `.end()` is used (by scripts); the local PGlite branch has no real pool. */
export const pool: { end: () => Promise<unknown> } = isLocalDatabase
  ? { end: async () => localPglite?.close() }
  : remotePool!;

type Database = ReturnType<typeof drizzle>;

// Both drivers expose the same query builder for our schema, but their types are
// structurally distinct, so narrow the union back to one driver.
export const db: Database = (isLocalDatabase
  ? drizzlePglite(localPglite!)
  : drizzle(remotePool!)) as unknown as Database;

export async function initializeDatabase() {
  if (globalForDb.__arenaNextJsPgliteReady) {
    await globalForDb.__arenaNextJsPgliteReady;
  }
}
