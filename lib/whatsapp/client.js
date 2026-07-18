/**
 * Low-level Meta Graph API HTTP client.
 * All WhatsApp Cloud API calls go through here — one place for auth, base URL, error handling.
 */

import { meta } from "@/lib/config";

function baseUrl() {
  return `https://graph.facebook.com/${meta.apiVersion}`;
}

/**
 * POST to a phone-number-scoped path (most Cloud API calls).
 * @param {string} phoneNumberId — override per-call for multi-tenant setups
 * @param {string} path          — e.g. "/messages"
 * @param {object} body
 */
export async function graphPost(phoneNumberId, path, body) {
  const url = `${baseUrl()}/${phoneNumberId ?? meta.phoneNumberId}${path}`;
  return _call(url, "POST", body);
}

/**
 * GET a Graph API resource (health checks, template status, etc.)
 */
export async function graphGet(path) {
  const url = `${baseUrl()}${path}`;
  return _call(url, "GET");
}

async function _call(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization:  `Bearer ${meta.accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Meta ${method} ${url} → ${res.status}: ${text}`);
  }
  return res.json();
}
