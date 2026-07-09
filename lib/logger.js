/**
 * Structured JSON logger for API routes.
 *
 * In dev, falls back to human-readable console.log so the terminal stays
 * readable without a log aggregator. In prod, emits newline-delimited JSON
 * that Vercel / any log aggregator can parse.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   const log = logger(request);          // binds requestId + path
 *   log.info("booking created", { id });  // { level, requestId, path, msg, ...meta }
 *   log.warn("slot conflict", { ... });
 *   log.error("DB failure", err);         // third arg accepts Error
 */

const IS_PROD = process.env.NODE_ENV === "production";

function emit(level, requestId, path, msg, meta, err) {
  const entry = {
    level,
    time: new Date().toISOString(),
    requestId,
    path,
    msg,
    ...meta,
    ...(err && { errMsg: err.message, stack: IS_PROD ? undefined : err.stack }),
  };
  if (IS_PROD) {
    console.log(JSON.stringify(entry));
  } else {
    const prefix = `[${level.toUpperCase()}] ${requestId ? `(${requestId.slice(0, 8)}) ` : ""}${path ?? ""}`;
    if (level === "error") console.error(prefix, msg, meta ?? "", err ?? "");
    else if (level === "warn") console.warn(prefix, msg, meta ?? "");
    else console.log(prefix, msg, meta ?? "");
  }
}

export function logger(requestOrId) {
  // Accept either a Request object (extracts header + url) or a bare string id
  let requestId, path;
  if (typeof requestOrId === "string") {
    requestId = requestOrId;
  } else if (requestOrId?.headers) {
    requestId = requestOrId.headers.get("x-request-id") || crypto.randomUUID();
    path = new URL(requestOrId.url).pathname;
  } else {
    requestId = crypto.randomUUID();
  }
  return {
    info:  (msg, meta)      => emit("info",  requestId, path, msg, meta),
    warn:  (msg, meta)      => emit("warn",  requestId, path, msg, meta),
    error: (msg, meta, err) => emit("error", requestId, path, msg, meta, err instanceof Error ? err : undefined),
    requestId,
  };
}

// Attach X-Request-ID to a NextResponse, generating one if absent.
export function withRequestId(request, response) {
  const id = request.headers.get("x-request-id") || crypto.randomUUID();
  response.headers.set("x-request-id", id);
  return response;
}
