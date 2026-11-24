/**
 * Runs once when the server boots, before the first request is handled.
 * Preparing the database here keeps pages from querying a half-initialized
 * schema (layout and page components render in parallel, so awaiting
 * ensureSeeded() in a layout is not enough to protect the page).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { initializeDatabase } = await import("@/db");
    await initializeDatabase();

    const { ensureSeeded } = await import("@/lib/bootstrap");
    await ensureSeeded();
  } catch (error) {
    console.error("[instrumentation] database bootstrap failed", error);
  }
}
