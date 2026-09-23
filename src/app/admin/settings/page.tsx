import { requirePermission } from "@/lib/auth/guards";
import { isStripeConfigured } from "@/lib/stripe";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requirePermission("settings.view");

  const resendOk = Boolean(
    process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("placeholder")
  );
  const stripeOk = isStripeConfigured();

  const rows = [
    { label: "Site name", value: SITE.name },
    { label: "Email", value: SITE.email },
    { label: "Phone", value: SITE.phone },
    { label: "Checkout", value: stripeOk ? "Stripe configured" : "Set STRIPE_SECRET_KEY" },
    {
      label: "Stripe publishable",
      value:
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
        !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes("placeholder")
          ? "Set"
          : "Missing",
    },
    {
      label: "Stripe webhook",
      value:
        process.env.STRIPE_WEBHOOK_SECRET &&
        !process.env.STRIPE_WEBHOOK_SECRET.includes("placeholder")
          ? "Set"
          : "Missing (needed to mark orders paid)",
    },
    { label: "Resend email", value: resendOk ? "Live" : "Dev skip (set RESEND_API_KEY)" },
    { label: "Email from", value: process.env.EMAIL_FROM || "default" },
  ];

  return (
    <div>
      <h1 className="admin-h1">Settings</h1>
      <p className="admin-muted mb-4">
        This storefront is independent — payments run through Stripe on Lumina Hub. Secrets are
        edited in hosting env vars.
      </p>
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
      <p className="admin-muted mt-6 max-w-2xl text-sm">
        Point Stripe webhook to <code>/api/webhooks/stripe</code> for{" "}
        <code>checkout.session.completed</code>. Shipping methods are under Admin → Shipping.
      </p>
    </div>
  );
}
