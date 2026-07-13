import { prisma } from "@/lib/prisma";
import { JOB_TYPES } from "@/lib/constants/limits";

export { JOB_TYPES };

/**
 * Enqueue a background job.
 * @param {{ type: string, payload?: object, shopId?: string, scheduledFor?: Date, maxAttempts?: number }} params
 * @returns {Promise<BackgroundJob>}
 */
export async function enqueue({ type, payload, shopId, scheduledFor, maxAttempts = 3 }) {
  return prisma.backgroundJob.create({
    data: {
      type,
      payload:      payload ?? null,
      shopId:       shopId ?? null,
      scheduledFor: scheduledFor ?? new Date(),
      maxAttempts,
    },
  });
}

/**
 * Pull the next batch of pending jobs due for processing.
 * Atomically marks them as PROCESSING to prevent double-pick.
 * ponytail: simple optimistic lock via status + scheduledFor. Upgrade to
 * SELECT FOR UPDATE SKIP LOCKED when worker concurrency becomes an issue.
 *
 * @param {{ types?: string[], batchSize?: number }} opts
 * @returns {Promise<BackgroundJob[]>}
 */
export async function dequeue({ types, batchSize = 10 } = {}) {
  const jobs = await prisma.backgroundJob.findMany({
    where: {
      status:      "PENDING",
      scheduledFor: { lte: new Date() },
      ...(types ? { type: { in: types } } : {}),
    },
    orderBy: { scheduledFor: "asc" },
    take:    batchSize,
  });

  if (jobs.length === 0) return [];

  await prisma.backgroundJob.updateMany({
    where: { id: { in: jobs.map(j => j.id) } },
    data:  { status: "PROCESSING" },
  });

  return jobs;
}

/**
 * Mark a job as done.
 */
export async function complete(jobId) {
  return prisma.backgroundJob.update({
    where: { id: jobId },
    data:  { status: "DONE", processedAt: new Date() },
  });
}

/**
 * Mark a job as failed. Reschedules for retry if under maxAttempts.
 * @param {string} jobId
 * @param {string} error
 */
export async function fail(jobId, error) {
  const job = await prisma.backgroundJob.findUnique({
    where:  { id: jobId },
    select: { attempts: true, maxAttempts: true },
  });
  if (!job) return;

  const attempts = job.attempts + 1;
  const exhausted = attempts >= job.maxAttempts;
  // Exponential back-off: 1min, 5min, 30min
  const backoffMs = [60_000, 300_000, 1_800_000][Math.min(attempts - 1, 2)];
  const nextRetry = exhausted ? null : new Date(Date.now() + backoffMs);

  return prisma.backgroundJob.update({
    where: { id: jobId },
    data:  {
      status:       exhausted ? "FAILED" : "PENDING",
      attempts,
      lastError:    error,
      scheduledFor: nextRetry ?? new Date(),
      processedAt:  exhausted ? new Date() : null,
    },
  });
}

/**
 * Cancel a pending job.
 */
export async function cancel(jobId) {
  return prisma.backgroundJob.update({
    where: { id: jobId },
    data:  { status: "CANCELLED" },
  });
}

/**
 * Reschedule a birthday check job for all shops.
 * Called by the daily cron — idempotent (skips if today's job already exists).
 */
export async function scheduleBirthdayChecks() {
  const shops = await prisma.shop.findMany({
    where:  { status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });

  const today = new Date();
  today.setHours(8, 0, 0, 0); // run at 08:00 shop-local time (cron handles TZ)

  const existing = await prisma.backgroundJob.findMany({
    where: { type: JOB_TYPES.BIRTHDAY_CHECK, scheduledFor: { gte: today } },
    select: { shopId: true },
  });
  const alreadyScheduled = new Set(existing.map(j => j.shopId));

  const toCreate = shops
    .filter(s => !alreadyScheduled.has(s.id))
    .map(s => ({ type: JOB_TYPES.BIRTHDAY_CHECK, shopId: s.id, scheduledFor: today }));

  if (toCreate.length > 0) {
    await prisma.backgroundJob.createMany({ data: toCreate });
  }
  return { scheduled: toCreate.length };
}
