import { requirePermission } from "@/lib/auth/guards";
import { getStripeReadiness } from "@/lib/stripe";
import { SITE } from "@/lib/site";
import { getSiteUrl } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requirePermission("settings.view");

  const resendOk = Boolean(
    process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("placeholder")
  );
  const stripe = getStripeReadiness();
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const webhookUrl = `${siteUrl}/api/webhooks/stripe`;

  const rows = [
    { label: "Site name", value: SITE.name },
    { label: "Public URL", value: siteUrl },
    { label: "Email", value: SITE.email },
    { label: "Phone", value: SITE.phone },
    {
      label: "Stripe mode",
      value:
        stripe.mode === "off"
          ? "Off — add keys in Vercel env"
          : stripe.mode === "live"
            ? "Live"
            : "Test",
    },
    {
      label: "STRIPE_SECRET_KEY",
      value: stripe.secret ? "Configured" : "Missing",
    },
    {
      label: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      value: stripe.publishable ? "Configured" : "Missing",
    },
    {
      label: "STRIPE_WEBHOOK_SECRET",
      value: stripe.webhook
        ? "Configured"
        : "Missing — orders stay unpaid without this",
    },
    {
      label: "Checkout ready",
      value: stripe.ready ? "Yes — can take Stripe payments" : "No — finish blockers below",
    },
    { label: "Resend email", value: resendOk ? "Live" : "Dev skip (set RESEND_API_KEY)" },
    { label: "Email from", value: process.env.EMAIL_FROM || "default" },
  ];

  return (
    <div>
      <h1 className="admin-h1">Settings</h1>
      <p className="admin-muted mb-4">
        Payments run through Stripe on Lumina Hub. Secrets are edited in hosting env vars (Vercel),
        then redeployed.
      </p>

      <div className="admin-panel mb-4 max-w-2xl">
        <h2 className="admin-h2">Go-live: Stripe</h2>
        <ol className="admin-body text-sm space-y-2 list-decimal pl-5 m-0">
          <li>
            In Stripe Dashboard → Developers → API keys, copy Secret and Publishable keys (use{" "}
            <strong>test</strong> first, then live).
          </li>
          <li>
            In Vercel → Project → Settings → Environment Variables, set:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                <code>STRIPE_SECRET_KEY</code>
              </li>
              <li>
                <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> (and optionally{" "}
                <code>STRIPE_PUBLISHABLE_KEY</code>)
              </li>
              <li>
                <code>STRIPE_WEBHOOK_SECRET</code>
              </li>
              <li>
                <code>NEXT_PUBLIC_SITE_URL</code> = <code>{siteUrl}</code>
              </li>
            </ul>
          </li>
          <li>
            Stripe → Developers → Webhooks → Add endpoint:
            <br />
            <code className="break-all">{webhookUrl}</code>
            <br />
            Event: <code>checkout.session.completed</code>. Paste the signing secret into{" "}
            <code>STRIPE_WEBHOOK_SECRET</code>.
          </li>
          <li>Redeploy on Vercel, then place a small test order.</li>
        </ol>
      </div>

      <div className="admin-table-wrap max-w-2xl">
        <table className="admin-table">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="font-medium w-1/3">{r.label}</td>
                <td className="admin-muted break-all">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
