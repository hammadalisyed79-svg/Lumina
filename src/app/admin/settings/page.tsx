import { requirePermission } from "@/lib/auth/guards";
import { isCheckoutLive, isShopifyConfigured } from "@/lib/shopify";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requirePermission("settings.view");

  const resendOk = Boolean(
    process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("placeholder")
  );
  const checkoutLive = isCheckoutLive();
  const storefrontApi = isShopifyConfigured();

  const rows = [
    { label: "Site name", value: SITE.name },
    { label: "Email", value: SITE.email },
    { label: "Phone", value: SITE.phone },
    { label: "Checkout live", value: checkoutLive ? "Yes (permalink or Storefront)" : "No" },
    { label: "Shopify Storefront API", value: storefrontApi ? "Configured" : "Not set (using cart permalink)" },
    {
      label: "Checkout domain",
      value: process.env.SHOPIFY_CHECKOUT_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN || "www.luminahub.co.uk",
    },
    { label: "Resend email", value: resendOk ? "Live" : "Dev skip (set RESEND_API_KEY)" },
    { label: "Email from", value: process.env.EMAIL_FROM || "default" },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Settings</h1>
      <p className="text-sm text-[color:var(--muted)] mb-8">
        Environment and commerce status. Secrets are edited in hosting env vars, not here.
      </p>
      <div className="border border-[color:var(--line)] bg-white/70 overflow-hidden max-w-2xl">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-[color:var(--line)]">
                <td className="p-3 font-medium w-1/3">{r.label}</td>
                <td className="p-3 text-[color:var(--muted)] break-all">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-[color:var(--muted)] mt-6 max-w-2xl">
        To send password-reset and order emails, set a real <code>RESEND_API_KEY</code> and verified{" "}
        <code>EMAIL_FROM</code>. Shipping methods are managed under Admin → Shipping.
      </p>
    </div>
  );
}
