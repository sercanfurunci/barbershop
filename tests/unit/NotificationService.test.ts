import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notificationJob: {
      create:     vi.fn(),
      createMany: vi.fn(),
      findMany:   vi.fn(),
    },
    notificationSettings: {
      findUnique: vi.fn(),
    },
    pushToken: {
      findMany: vi.fn(),
    },
    appointment: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/notifications", () => ({
  queueNotifications: vi.fn(),
}));

// ── Imports after mocks ──────────────────────────────────────────────────────

import { notify, notifyInApp, notifyPush, hasAnyChannelConfigured } from "@/lib/services/NotificationService";
import { prisma } from "@/lib/prisma";
import { queueNotifications } from "@/lib/notifications";

const p = prisma as any;

// ── notify ───────────────────────────────────────────────────────────────────

describe("notify", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates to queueNotifications with appointmentId and event", async () => {
    (queueNotifications as any).mockResolvedValue(undefined);

    await notify("appt-1", "CREATED");

    expect(queueNotifications).toHaveBeenCalledWith("appt-1", "CREATED");
  });

  it("passes through all NOTIF_EVENT values", async () => {
    (queueNotifications as any).mockResolvedValue(undefined);

    const events = ["CREATED", "CONFIRMED", "CANCELLED", "REMINDER_48H", "REMINDER_3H", "FOLLOWUP"];
    for (const event of events) {
      await notify("appt-x", event);
      expect(queueNotifications).toHaveBeenLastCalledWith("appt-x", event);
    }
  });
});

// ── notifyInApp ──────────────────────────────────────────────────────────────

describe("notifyInApp", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an IN_APP NotificationJob with provided params", async () => {
    const job = {
      id: "job-1",
      shopId: "shop-1",
      appointmentId: "appt-1",
      channel: "IN_APP",
      event: "CREATED",
      message: "Your appointment is confirmed",
    };
    p.notificationJob.create.mockResolvedValue(job);

    const result = await notifyInApp({
      shopId:        "shop-1",
      appointmentId: "appt-1",
      message:       "Your appointment is confirmed",
      event:         "CREATED",
    });

    expect(p.notificationJob.create).toHaveBeenCalledTimes(1);
    const callArg = p.notificationJob.create.mock.calls[0][0];
    expect(callArg.data.channel).toBe("IN_APP");
    expect(callArg.data.shopId).toBe("shop-1");
    expect(callArg.data.appointmentId).toBe("appt-1");
    expect(callArg.data.message).toBe("Your appointment is confirmed");
    expect(result.id).toBe("job-1");
  });

  it("defaults event to CREATED when not provided", async () => {
    p.notificationJob.create.mockResolvedValue({ id: "job-2" });

    await notifyInApp({ shopId: "shop-1", message: "Hello" });

    const callArg = p.notificationJob.create.mock.calls[0][0];
    expect(callArg.data.event).toBe("CREATED");
  });

  it("sets appointmentId to null when not provided", async () => {
    p.notificationJob.create.mockResolvedValue({ id: "job-3" });

    await notifyInApp({ shopId: "shop-1", message: "No appt" });

    const callArg = p.notificationJob.create.mock.calls[0][0];
    expect(callArg.data.appointmentId).toBeNull();
  });

  it("accepts a custom event type", async () => {
    p.notificationJob.create.mockResolvedValue({ id: "job-4" });

    await notifyInApp({ shopId: "shop-1", message: "Cancelled", event: "CANCELLED" });

    const callArg = p.notificationJob.create.mock.calls[0][0];
    expect(callArg.data.event).toBe("CANCELLED");
  });
});

// ── notifyPush ───────────────────────────────────────────────────────────────

describe("notifyPush", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates PUSH jobs for each token the user has", async () => {
    p.pushToken.findMany.mockResolvedValue([{ token: "tok-a" }, { token: "tok-b" }]);
    p.notificationJob.createMany.mockResolvedValue({ count: 2 });

    await notifyPush({ userId: "user-1", shopId: "shop-1", message: "Reminder", event: "REMINDER_3H" });

    expect(p.notificationJob.createMany).toHaveBeenCalledTimes(1);
    const { data } = p.notificationJob.createMany.mock.calls[0][0];
    expect(data).toHaveLength(2);
    for (const job of data) {
      expect(job.channel).toBe("PUSH");
      expect(job.shopId).toBe("shop-1");
      expect(job.message).toBe("Reminder");
      expect(job.phone).toBeNull();
    }
  });

  it("does nothing when user has no push tokens", async () => {
    p.pushToken.findMany.mockResolvedValue([]);

    await notifyPush({ userId: "user-1", shopId: "shop-1", message: "Msg" });

    expect(p.notificationJob.createMany).not.toHaveBeenCalled();
  });

  it("looks up tokens by userId", async () => {
    p.pushToken.findMany.mockResolvedValue([]);

    await notifyPush({ userId: "user-42", shopId: "shop-1", message: "Hi" });

    expect(p.pushToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-42" } })
    );
  });
});

// ── hasAnyChannelConfigured ──────────────────────────────────────────────────

describe("hasAnyChannelConfigured", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when smsEnabled is true", async () => {
    p.notificationSettings.findUnique.mockResolvedValue({ smsEnabled: true, waEnabled: false });

    const result = await hasAnyChannelConfigured("shop-1");
    expect(result).toBe(true);
  });

  it("returns true when waEnabled is true", async () => {
    p.notificationSettings.findUnique.mockResolvedValue({ smsEnabled: false, waEnabled: true });

    const result = await hasAnyChannelConfigured("shop-1");
    expect(result).toBe(true);
  });

  it("returns true when both SMS and WhatsApp are enabled", async () => {
    p.notificationSettings.findUnique.mockResolvedValue({ smsEnabled: true, waEnabled: true });

    const result = await hasAnyChannelConfigured("shop-1");
    expect(result).toBe(true);
  });

  it("returns false when both channels are disabled", async () => {
    p.notificationSettings.findUnique.mockResolvedValue({ smsEnabled: false, waEnabled: false });

    const result = await hasAnyChannelConfigured("shop-1");
    expect(result).toBe(false);
  });

  it("returns false when no settings row exists", async () => {
    p.notificationSettings.findUnique.mockResolvedValue(null);

    const result = await hasAnyChannelConfigured("shop-1");
    expect(result).toBe(false);
  });

  it("queries by shopId", async () => {
    p.notificationSettings.findUnique.mockResolvedValue(null);

    await hasAnyChannelConfigured("shop-99");

    expect(p.notificationSettings.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { shopId: "shop-99" } })
    );
  });
});
