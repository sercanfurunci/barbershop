import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export function withRequestId(request: NextRequest, response: NextResponse): NextResponse {
  const id = request.headers.get("x-request-id") ?? randomUUID();
  response.headers.set("x-request-id", id);
  return response;
}

export function getRequestId(request: NextRequest | Request): string {
  return (request as NextRequest).headers?.get?.("x-request-id") ?? randomUUID();
}
