import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const sp = await searchParams;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="container-site py-14 max-w-2xl">
      {sp.success && (
        <p className="eyebrow text-[color:var(--bronze)] mb-3">Confirmed</p>
      )}
      <h1 className="font-display text-4xl mb-2">Thank you</h1>
      <p className="prose-muted mb-8">
        Order <strong>{order.orderNumber}</strong> · {order.paymentStatus.toLowerCase().replace("_", " ")}
      </p>
      <ul className="space-y-4 mb-8">
        {order.items.map((item) => (
          <li key={item.id} className="border-b border-[color:var(--line)] pb-4">
            <p className="font-medium">
              {item.quantity}× {item.title}
            </p>
            {item.configJson && (
              <pre className="text-xs text-[color:var(--muted)] mt-2 whitespace-pre-wrap font-sans">
                {JSON.stringify(item.configJson, null, 2)}
              </pre>
            )}
            <p className="text-sm mt-2">{formatMoney(toNumber(item.lineTotal))}</p>
          </li>
        ))}
      </ul>
      <div className="space-y-1 text-sm mb-8">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>{formatMoney(order.shippingTotal)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>−{formatMoney(order.discountTotal)}</span></div>
        <div className="flex justify-between font-medium text-base pt-2"><span>Total</span><span>{formatMoney(order.total)}</span></div>
      </div>
      <Link href="/shop/lampshades" className="btn-secondary">
        Continue shopping
      </Link>
    </div>
  );
}
