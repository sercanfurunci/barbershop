/**
 * Validates required environment variables at module load time.
 * Import via instrumentation.ts so it fails fast at server startup.
 * In test environments (NODE_ENV=test) validation is skipped.
 */

const IS_TEST = process.env.NODE_ENV === "test";
const IS_PROD = process.env.NODE_ENV === "production";

function validate(vars) {
  if (IS_TEST) return;
  const missing = vars.filter(k => !process.env[k]);
  if (missing.length > 0) {
    const list = missing.join(", ");
    if (IS_PROD) throw new Error(`Missing required environment variables: ${list}`);
    else console.warn(`[env] Missing env vars (ok in dev): ${list}`);
  }
}

// Required in all environments
validate(["DATABASE_URL"]);

// Required in production
if (IS_PROD) {
  validate(["JWT_SECRET"]);
  validate(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]);
  validate(["NETGSM_USER", "NETGSM_PASSWORD"]);
  validate(["CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"]);
  validate(["CRON_SECRET"]);
}

export const ENV = {
  isDev:     process.env.NODE_ENV === "development",
  isProd:    IS_PROD,
  isTest:    IS_TEST,
  dbUrl:     process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-prod",
};
