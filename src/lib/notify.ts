import { siteUrl } from "@/lib/site";

// Transactional email through Resend (https://resend.com). Without RESEND_API_KEY this is a silent no-op,
// so the app works identically in demo mode. Set EMAIL_FROM to a verified sender once you have a domain.
export const emailEnabled = () => !!process.env.RESEND_API_KEY;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Tabis Pork Palace <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function emailOrderEvent(p: { to: string; name: string; code: string; headline: string; message: string; total?: number }) {
  if (!emailEnabled()) return;
  const track = `${siteUrl()}/track?code=${encodeURIComponent(p.code)}&contact=${encodeURIComponent(p.to)}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;background:#F7F4EC;padding:24px">
  <div style="max-width:540px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4ede7">
    <div style="background:#123D27;padding:20px 24px"><div style="color:#F7F4EC;font-size:22px;letter-spacing:3px;font-weight:700">TABIS</div><div style="color:#d4b06a;font-size:10px;letter-spacing:4px">PORK PALACE</div></div>
    <div style="padding:24px;color:#171A17">
      <p>Hi ${esc(p.name.split(" ")[0])},</p>
      <h2 style="color:#123D27;margin:8px 0">${esc(p.headline)}</h2>
      <p style="line-height:1.6">${esc(p.message)}</p>
      <p><strong>Order ${esc(p.code)}</strong>${p.total !== undefined ? ` · ₦${p.total.toLocaleString("en-NG")}` : ""}</p>
      <p><a href="${track}" style="display:inline-block;background:#123D27;color:#F7F4EC;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Track your order</a></p>
    </div>
  </div></div>`;
  await sendEmail(p.to, `${p.headline} — ${p.code}`, html);
}
