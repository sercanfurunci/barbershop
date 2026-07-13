import { requireAuth } from "@/lib/auth";
import { unauthorized, forbidden } from "@/lib/apiResponse";

/**
 * withRole(roles, handler) — wraps a Next.js route handler with role-based auth.
 *
 * Usage:
 *   export const GET = withRole(['ADMIN', 'SUPER_ADMIN'], async (req, ctx, payload) => { ... })
 *
 * The handler receives (req, ctx, payload) where payload is the verified JWT payload.
 * Responds 401 when unauthenticated, 403 when role is not in `roles`.
 */
export function withRole(roles, handler) {
  return async function (req, ctx) {
    const payload = await requireAuth(req);
    if (!payload) return unauthorized();
    if (!roles.includes(payload.role)) return forbidden();
    return handler(req, ctx, payload);
  };
}

/**
 * withAuth(handler) — any authenticated user, no role restriction.
 *
 * Usage:
 *   export const GET = withAuth(async (req, ctx, payload) => { ... })
 */
export function withAuth(handler) {
  return async function (req, ctx) {
    const payload = await requireAuth(req);
    if (!payload) return unauthorized();
    return handler(req, ctx, payload);
  };
}
