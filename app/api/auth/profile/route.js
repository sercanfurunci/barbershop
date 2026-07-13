import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withRole";

export const PATCH = withAuth(async (request, _ctx, payload) => {

  const { username, displayName } = await request.json();

  const data = {};

  if (username !== undefined) {
    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: "Kullanıcı adı 3-20 karakter, sadece küçük harf/rakam/_ olabilir" },
        { status: 400 }
      );
    }
    data.username = username || null;
  }

  if (displayName !== undefined) {
    data.displayName = displayName?.trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data,
      select: { id: true, email: true, username: true, displayName: true, role: true },
    });
    return NextResponse.json(user);
  } catch (e) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış" }, { status: 409 });
    }
    throw e;
  }
});
