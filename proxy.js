import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Stamp a request ID on every API call so logs correlate across functions.
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  // Rewrite /api/v1/* → /api/* — mobile pins to a stable versioned prefix.
  if (pathname.startsWith("/api/v1/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/api/v1/", "/api/");
    const res = NextResponse.rewrite(url);
    res.headers.set("x-request-id", requestId);
    return res;
  }

  if (pathname.startsWith("/api/")) {
    const res = NextResponse.next();
    res.headers.set("x-request-id", requestId);
    return res;
  }
}

export const config = {
  matcher: "/api/:path*",
};
