import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { ok, err, created, tooManyRequests } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function POST(req) {
  // 3 leads per 10 minutes per IP
  const ip = getIp(req);
  const rl = await rateLimit(`leads:${ip}`, { limit: 3, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return tooManyRequests(rl.retryAfter);
  }

  const body = await req.json().catch(() => ({}));
  const { businessName, name, phone, email, message } = body;

  if (!businessName?.trim() || !name?.trim() || !phone?.trim()) {
    return err("businessName, name ve phone zorunludur.");
  }

  // Length caps to prevent abuse
  if (businessName.trim().length > 120) return err("businessName çok uzun.");
  if (name.trim().length > 80)          return err("name çok uzun.");
  if (phone.trim().length > 20)         return err("phone çok uzun.");
  if (email && email.trim().length > 120) return err("email çok uzun.");
  if (message && message.trim().length > 1000) return err("Mesaj çok uzun.");

  // Basic email format check
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return err("Geçersiz e-posta formatı.");
  }

  await prisma.lead.create({
    data: {
      businessName: businessName.trim(),
      name:         name.trim(),
      phone:        phone.trim(),
      email:        email?.trim() || null,
      message:      message?.trim() || null,
    },
  });

  return created({ ok: true });
}
