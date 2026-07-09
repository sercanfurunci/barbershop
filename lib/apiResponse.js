import { NextResponse } from "next/server";

// Consistent response constructors for API routes.
// Shape contract (web + mobile):
//   success → raw payload (array or object) — compatible with existing apiFetch
//   error   → { error: string }             — apiFetch reads err.error on non-2xx
//
// Use these in new routes; don't retrofit old ones unless you're already touching them.

export const ok = (data, status = 200) => NextResponse.json(data, { status });

export const err = (message, status = 400) =>
  NextResponse.json({ error: message }, { status });

export const tooManyRequests = (retryAfter) =>
  NextResponse.json(
    { error: "Çok fazla istek. Lütfen bekleyin." },
    { status: 429, headers: { "Retry-After": String(retryAfter ?? 60) } }
  );
