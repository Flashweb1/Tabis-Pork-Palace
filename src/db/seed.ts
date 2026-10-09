import { seedDatabase } from "@/db/seed-data";
import { pool } from "@/db";

async function main() {
  const reset = process.argv.includes("--reset");
  const done = await seedDatabase({ reset });
  console.log(done ? "Seeded Tabis Pork Palace demo data." : "Database already seeded (use --reset to rebuild).");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
