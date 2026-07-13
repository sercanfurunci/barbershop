import { NextResponse } from "next/server";

// Consistent response constructors for API routes.
// Shape contract (web + mobile):
//   success → raw payload (array or object) — compatible with existing apiFetch
//   error   → { error: string }             — apiFetch reads err.error on non-2xx
//
// Use these instead of inline NextResponse.json({...}) in every route.

export const ok = (data, status = 200) => NextResponse.json(data, { status });

export const created = (data) => NextResponse.json(data, { status: 201 });

export const noContent = () => new NextResponse(null, { status: 204 });

export const err = (message, status = 400, code) =>
  NextResponse.json(code ? { error: message, code } : { error: message }, { status });

export const badRequest   = (msg, code)          => err(msg, 400, code);
export const unauthorized = ()                   => err("Unauthorized", 401);
export const forbidden    = ()                   => err("Forbidden", 403);
export const notFound     = (what = "Not found") => err(what, 404);
export const conflict     = (msg)                => err(msg, 409);

export const tooManyRequests = (retryAfter) =>
  NextResponse.json(
    { error: "Çok fazla istek. Lütfen bekleyin." },
    { status: 429, headers: { "Retry-After": String(retryAfter ?? 60) } }
  );

export const serverError = (msg = "Sunucu hatası") => err(msg, 500);
