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
  const onCustomDomain =
    siteUrl.includes("luminahub.co.uk") && !siteUrl.includes("vercel.app");

  const rows = [
    { label: "Site name", value: SITE.name },
    { label: "Public URL (env)", value: siteUrl },
    {
      label: "Custom domain",
      value: onCustomDomain
        ? "Configured in env — confirm DNS points to Vercel"
        : "Still on *.vercel.app — add luminahub.co.uk in Vercel + DNS",
    },
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
        Payments and domain are controlled by hosting env vars (Vercel). Update secrets, then
        redeploy.
      </p>

      <div className="admin-panel mb-4 max-w-2xl">
        <h2 className="admin-h2">Go-live: Domain</h2>
        <p className="admin-muted text-sm mb-3">
          Today <code>luminahub.co.uk</code> / <code>www</code> still resolve to{" "}
          <strong>Shopify</strong>. Pointing DNS at Vercel will take the old Shopify storefront off
          that domain.
        </p>
        <ol className="admin-body text-sm space-y-2 list-decimal pl-5 m-0">
          <li>
            Vercel → Project → Settings → Domains → add{" "}
            <code>www.luminahub.co.uk</code> and <code>luminahub.co.uk</code>. Prefer{" "}
            <strong>www</strong> as primary; redirect apex → www.
          </li>
          <li>
            At your DNS host (GoDaddy / domaincontrol NS), set:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                <code>www</code> → CNAME <code>cname.vercel-dns.com</code>
              </li>
              <li>
                Apex <code>@</code> → A <code>76.76.21.21</code> (or follow Vercel’s exact
                values)
              </li>
            </ul>
          </li>
          <li>
            Vercel env (Production):
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                <code>NEXT_PUBLIC_SITE_URL</code> = <code>https://www.luminahub.co.uk</code>
              </li>
              <li>
                <code>AUTH_URL</code> / <code>NEXTAUTH_URL</code> = same
              </li>
            </ul>
            Then redeploy.
          </li>
          <li>
            Update Stripe webhook URL to{" "}
            <code className="break-all">https://www.luminahub.co.uk/api/webhooks/stripe</code>{" "}
            (keep the old *.vercel.app endpoint until cutover is verified).
          </li>
        </ol>
      </div>

      <div className="admin-panel mb-4 max-w-2xl">
        <h2 className="admin-h2">Go-live: Stripe</h2>
        <ol className="admin-body text-sm space-y-2 list-decimal pl-5 m-0">
          <li>
            Stripe Dashboard → Developers → API keys (use <strong>test</strong> first, then live).
          </li>
          <li>
            Vercel env: <code>STRIPE_SECRET_KEY</code>,{" "}
            <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>, <code>STRIPE_WEBHOOK_SECRET</code>.
          </li>
          <li>
            Webhook endpoint: <code className="break-all">{webhookUrl}</code> · event{" "}
            <code>checkout.session.completed</code>.
          </li>
          <li>Redeploy, then place a small test order.</li>
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
