/**
 * Observability abstraction layer.
 *
 * Providers are swappable — set OBSERVABILITY_PROVIDER env var:
 *   - "sentry"      → Sentry (not yet installed, provider returns no-ops)
 *   - "betterstack" → Better Stack Logs
 *   - "console"     → structured console output (default)
 *
 * New code should call captureException() and addBreadcrumb() from here,
 * never vendor-specific APIs directly.
 */

type Severity = "debug" | "info" | "warning" | "error" | "fatal";

interface ObservabilityEvent {
  message: string;
  severity?: Severity;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  userId?: string;
  shopId?: string;
}

// Capture an unhandled exception with optional context
export function captureException(
  error: Error | unknown,
  context: Omit<ObservabilityEvent, "message"> = {}
): void {
  const err = error instanceof Error ? error : new Error(String(error));

  // Console fallback — always available
  console.error(JSON.stringify({
    type: "exception",
    time: new Date().toISOString(),
    msg: err.message,
    stack: err.stack?.split("\n").slice(0, 5).join("\n"),
    ...context,
  }));

  // Future: if (process.env.SENTRY_DSN) Sentry.captureException(err, { extra: context.extra });
}

// Track a named event (user action, business event)
export function trackEvent(
  name: string,
  properties: Record<string, unknown> = {}
): void {
  if (process.env.NODE_ENV !== "production") return;
  // Future: PostHog.capture(name, properties)
  // For now: structured log for ingestion
  console.log(JSON.stringify({
    type: "event",
    time: new Date().toISOString(),
    event: name,
    ...properties,
  }));
}

// Add a breadcrumb for error context
export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  // Future: Sentry.addBreadcrumb({ message, data });
  void message;
  void data;
}

// Performance monitoring
export function startSpan(name: string, op: string): { finish: () => void } {
  const start = Date.now();
  return {
    finish: () => {
      const duration = Date.now() - start;
      if (duration > 1000) {
        console.warn(JSON.stringify({ type: "slow_span", op, name, ms: duration }));
      }
      // Future: Sentry/OTel span tracking
    },
  };
}
