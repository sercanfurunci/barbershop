/**
 * Conversation state manager.
 *
 * Prod: Upstash Redis (reuses existing UPSTASH_* env vars).
 * Dev:  In-process Map with TTL cleanup — same fallback pattern as rateLimit.js.
 *
 * State is keyed by (shopId, senderPhone) and expires after TTL_MS of inactivity.
 * Only the last MAX_MESSAGES messages are kept to bound token cost.
 */

import { Redis } from "@upstash/redis";
import { rateLimit as rlConfig } from "@/lib/config";

const TTL_MS       = 30 * 60 * 1000; // 30 min inactivity resets conversation
const MAX_MESSAGES = 8;               // 4 exchanges — enough context, not a transcript

// ── Redis backend (lazy — same pattern as rateLimit.js) ──────────────────────
let _redis;
function getRedis() {
  if (_redis !== undefined) return _redis;
  const url   = rlConfig.upstashUrl;
  const token = rlConfig.upstashToken;
  _redis = (url && token) ? new Redis({ url, token }) : null;
  return _redis;
}

// ── In-process fallback ───────────────────────────────────────────────────────
const _store = new Map();
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of _store) if (now > v._exp) _store.delete(k);
  }, 60_000).unref?.();
}

function key(shopId, phone) {
  return `wa:conv:${shopId}:${phone}`;
}

export async function getState(shopId, phone) {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get(key(shopId, phone));
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  }
  const entry = _store.get(key(shopId, phone));
  if (!entry || Date.now() > entry._exp) return null;
  const { _exp: _ignored, ...state } = entry;
  return state;
}

export async function setState(shopId, phone, state) {
  const redis = getRedis();
  if (redis) {
    await redis.set(key(shopId, phone), JSON.stringify(state), { px: TTL_MS });
    return;
  }
  _store.set(key(shopId, phone), { ...state, _exp: Date.now() + TTL_MS });
}

export async function clearState(shopId, phone) {
  const redis = getRedis();
  if (redis) { await redis.del(key(shopId, phone)); return; }
  _store.delete(key(shopId, phone));
}

/** Initial blank state for a new conversation. */
export function freshState(shopId) {
  return {
    shopId,
    clientId:      null,
    barberId:      null,
    serviceId:     null,
    date:          null,
    time:          null,
    pendingAction: null,
    messages:      [],   // { role: "user"|"assistant", content: string }[]
  };
}

/** Append a message and trim to MAX_MESSAGES. */
export function addMessage(state, role, content) {
  const messages = [...(state.messages ?? []), { role, content }];
  return { ...state, messages: messages.slice(-MAX_MESSAGES) };
}
