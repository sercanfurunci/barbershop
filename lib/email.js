/**
 * Thin email sender. In prod, uses the Resend API when RESEND_API_KEY is set.
 * In dev (or when key is absent), logs the email to the console so you can
 * grab the link without a real mail account.
 *
 * Using fetch directly avoids adding a dependency for ~10 lines of HTTP.
 */

export async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] ${subject} → ${to}\n${html.replace(/<[^>]+>/g, "")}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Makas <noreply@makas.app>",
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[email] Resend error ${res.status}: ${text}`);
  }
}
