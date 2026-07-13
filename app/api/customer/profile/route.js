import { prisma } from "@/lib/prisma";
import { ok, err, notFound, conflict } from "@/lib/apiResponse";
import { withAuth } from "@/lib/middleware/withRole";

const CUSTOMER_SELECT = {
  id: true,
  email: true,
  displayName: true,
  phone: true,
  birthday: true,
  gender: true,
  avatarUrl: true,
  notifAppt: true,
  notifReminder: true,
  notifPromo: true,
};

// GET /api/customer/profile
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: CUSTOMER_SELECT,
  });

  if (!user) return notFound("Bulunamadı");
  return ok(user);
}

// DELETE /api/customer/profile — anonymises and marks deleted
export async function DELETE(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  // Anonymise: bump tokenVersion to invalidate all sessions, wipe PII
  await prisma.user.update({
    where: { id: payload.userId },
    data: {
      email:        `deleted_${payload.userId}@deleted.invalid`,
      displayName:  "Silinmiş Kullanıcı",
      phone:        null,
      avatarUrl:    null,
      tokenVersion: { increment: 1 },
    },
  });

  return ok({ ok: true });
}

// PATCH /api/customer/profile
export async function PATCH(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const body = await request.json();
  const allowed = ["displayName", "phone", "birthday", "gender", "avatarUrl", "notifAppt", "notifReminder", "notifPromo"];
  const data = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  if (data.birthday && typeof data.birthday === "string") {
    data.birthday = new Date(data.birthday);
    if (isNaN(data.birthday.getTime())) delete data.birthday;
  }

  if (Object.keys(data).length === 0) {
    return err("Güncellenecek alan yok");
  }

  if (data.displayName !== undefined && data.displayName !== null) {
    if (typeof data.displayName !== "string" || data.displayName.trim().length > 100) {
      return err("Görünen ad en fazla 100 karakter olabilir");
    }
    data.displayName = data.displayName.trim() || null;
  }

  if (data.gender !== undefined && data.gender !== null) {
    if (!["male", "female", "other"].includes(data.gender)) {
      return err("Geçersiz cinsiyet değeri");
    }
  }

  if (data.avatarUrl !== undefined && data.avatarUrl !== null) {
    if (typeof data.avatarUrl !== "string" || data.avatarUrl.length > 500 ||
        !/^https:\/\/res\.cloudinary\.com\//.test(data.avatarUrl)) {
      return err("Geçersiz avatar URL");
    }
  }

  if (data.phone) {
    const phone10 = data.phone.replace(/\D/g, "").slice(-10);
    if (phone10.length < 10) {
      return err("Geçersiz telefon numarası");
    }
    const phoneTaken = await prisma.user.findFirst({
      where: { phone: { endsWith: phone10 }, NOT: { id: payload.userId } },
    });
    if (phoneTaken) {
      return conflict("Bu telefon numarası zaten başka bir hesaba kayıtlı");
    }
  }

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data,
    select: CUSTOMER_SELECT,
  });

  return ok(user);
}
