import Stripe from "stripe";

let stripe: Stripe | null = null;

function cleanEnv(value: string | undefined): string {
  return (value || "").trim().replace(/^["']|["']$/g, "");
}

/** True when a usable Stripe secret key is present (test or live). */
export function isStripeConfigured(): boolean {
  const key = cleanEnv(process.env.STRIPE_SECRET_KEY);
  if (!key || key.includes("placeholder") || key.includes("...")) return false;
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) return false;
  // Real Stripe secrets are long; reject stubs like "sk_test_xxx"
  return key.length >= 20;
}

export function isStripeWebhookConfigured(): boolean {
  const secret = cleanEnv(process.env.STRIPE_WEBHOOK_SECRET);
  if (!secret || secret.includes("placeholder") || secret.includes("...")) return false;
  return secret.startsWith("whsec_") && secret.length >= 20;
}

export function isStripePublishableConfigured(): boolean {
  const key = cleanEnv(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY
  );
  if (!key || key.includes("placeholder") || key.includes("...")) return false;
  if (!key.startsWith("pk_test_") && !key.startsWith("pk_live_")) return false;
  return key.length >= 20;
}

export function getStripeMode(): "live" | "test" | "off" {
  if (!isStripeConfigured()) return "off";
  const key = cleanEnv(process.env.STRIPE_SECRET_KEY);
  return key.startsWith("sk_live_") ? "live" : "test";
}

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  const key = cleanEnv(process.env.STRIPE_SECRET_KEY);
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

export function getStripeReadiness() {
  const mode = getStripeMode();
  return {
    mode,
    secret: isStripeConfigured(),
    publishable: isStripePublishableConfigured(),
    webhook: isStripeWebhookConfigured(),
    ready: isStripeConfigured() && isStripePublishableConfigured() && isStripeWebhookConfigured(),
  };
}
