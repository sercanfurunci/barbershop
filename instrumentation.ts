// Next.js instrumentation hook — runs once at server startup (Node.js runtime only).
// Validates environment and registers global observability hooks.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Fail fast on missing config — catches deployment mistakes before serving traffic.
    await import("@/lib/env");
  }
}
