export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ok, err } from "@/lib/apiResponse";
import { verifySignature, verifyChallenge, handlePayload } from "@/lib/whatsapp/webhook";

// ── GET: Meta webhook challenge verification ──────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const challenge = verifyChallenge(
    searchParams.get("hub.mode"),
    searchParams.get("hub.verify_token"),
    searchParams.get("hub.challenge"),
  );
  if (!challenge) return new NextResponse("Forbidden", { status: 403 });
  return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
}

// ── POST: Incoming messages and status updates ────────────────────────────────
export async function POST(request) {
  const log = logger(request);

  // Raw body required for HMAC verification — must be read before any other parsing
  const rawBody  = await request.text();
  const sigHeader = request.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, sigHeader)) {
    log.warn("wa webhook signature rejected");
    return err("Unauthorized", 401);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return err("Invalid JSON", 400);
  }

  // Always respond 200 immediately. Meta retries on non-2xx, which causes duplicate messages.
  // Errors inside handlePayload are caught and logged there — they never surface here.
  handlePayload(payload, log).catch(e =>
    log.error("wa payload unhandled", {}, e),
  );

  return ok({ received: true });
}
