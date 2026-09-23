import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container-site py-20">Loading checkout…</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
