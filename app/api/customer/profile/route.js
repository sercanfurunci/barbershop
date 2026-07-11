import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: CUSTOMER_SELECT,
  });

  if (!user) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json(user);
}

// DELETE /api/customer/profile — anonymises and marks deleted
export async function DELETE(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  return NextResponse.json({ ok: true });
}

// PATCH /api/customer/profile
export async function PATCH(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  if (data.displayName !== undefined && data.displayName !== null) {
    if (typeof data.displayName !== "string" || data.displayName.trim().length > 100) {
      return NextResponse.json({ error: "Görünen ad en fazla 100 karakter olabilir" }, { status: 400 });
    }
    data.displayName = data.displayName.trim() || null;
  }

  if (data.gender !== undefined && data.gender !== null) {
    if (!["male", "female", "other"].includes(data.gender)) {
      return NextResponse.json({ error: "Geçersiz cinsiyet değeri" }, { status: 400 });
    }
  }

  if (data.avatarUrl !== undefined && data.avatarUrl !== null) {
    if (typeof data.avatarUrl !== "string" || data.avatarUrl.length > 500 ||
        !/^https:\/\/res\.cloudinary\.com\//.test(data.avatarUrl)) {
      return NextResponse.json({ error: "Geçersiz avatar URL" }, { status: 400 });
    }
  }

  if (data.phone) {
    const phone10 = data.phone.replace(/\D/g, "").slice(-10);
    if (phone10.length < 10) {
      return NextResponse.json({ error: "Geçersiz telefon numarası" }, { status: 400 });
    }
    const phoneTaken = await prisma.user.findFirst({
      where: { phone: { endsWith: phone10 }, NOT: { id: payload.userId } },
    });
    if (phoneTaken) {
      return NextResponse.json({ error: "Bu telefon numarası zaten başka bir hesaba kayıtlı" }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data,
    select: CUSTOMER_SELECT,
  });

  return NextResponse.json(user);
}
