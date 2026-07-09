import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { sendEmail } from "@/lib/email";
import { rateLimit, getIp } from "@/lib/rateLimit";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "makas-jwt-secret-change-in-production"
);

// POST /api/auth/forgot-password — { email }
// Always returns 200 so callers can't probe whether an email exists.
export async function POST(request) {
  const ip = getIp(request);
  const rl = await rateLimit(`forgot:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: true }); // still look like success
  }

  const { email } = await request.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, tokenVersion: true, email: true, displayName: true },
  });

  if (user) {
    // Sign a 1-hour reset token that embeds tokenVersion so it becomes
    // single-use after any password change or logout-all bumps the version.
    const token = await new SignJWT({ purpose: "reset", userId: user.id, tokenVersion: user.tokenVersion })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);

    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = `${base}/reset-password?token=${token}`;
    const name = user.displayName || "Merhaba";

    await sendEmail({
      to: user.email,
      subject: "Şifre Sıfırlama",
      html: `<p>${name},</p>
<p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın. Bağlantı 1 saat geçerlidir.</p>
<p><a href="${link}">${link}</a></p>
<p>Bu isteği siz yapmadıysanız bu e-postayı yoksayabilirsiniz.</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
