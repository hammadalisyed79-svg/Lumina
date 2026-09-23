import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || "Lumina Hub <orders@luminahub.co.uk>";

function client() {
  if (!resendKey || resendKey.includes("placeholder")) return null;
  return new Resend(resendKey);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const c = client();
  if (!c) {
    console.info("[email:dev]", input.subject, "→", input.to);
    return { id: "dev-skip", skipped: true as const };
  }
  const result = await c.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  return { id: result.data?.id, skipped: false as const };
}

export function orderConfirmationHtml(order: {
  orderNumber: string;
  email: string;
  total: string;
  itemsHtml: string;
  configNote?: string;
}) {
  return `
  <div style="font-family:Georgia,serif;color:#1c1915;background:#f3f1ec;padding:32px">
    <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border:1px solid #d9d2c5">
      <h1 style="font-weight:400;font-size:28px;margin:0 0 8px">Thank you</h1>
      <p style="color:#6e675c">Order <strong>${order.orderNumber}</strong> is confirmed.</p>
      <div style="margin:24px 0">${order.itemsHtml}</div>
      ${order.configNote ? `<p style="font-size:14px;color:#6e675c">${order.configNote}</p>` : ""}
      <p style="margin-top:24px">Total: <strong>${order.total}</strong></p>
      <p style="color:#6e675c;font-size:13px;margin-top:32px">Lumina Hub · Handmade in Britain</p>
    </div>
  </div>`;
}
