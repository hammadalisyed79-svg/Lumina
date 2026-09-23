"use client";

import { useEffect, useState } from "react";
import { formatGBP } from "@/lib/money";

type Stats = {
  productCount: number;
  orderCount: number;
  messageCount: number;
  subscriberCount: number;
  revenue: number;
  categories: { name: string; count: number }[];
};

export default function AdminPage() {
  const [key, setKey] = useState("luminahub-admin");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<
    { id: string; email: string; total: number; status: string; created_at: string }[]
  >([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const res = await fetch("/api/admin", {
      headers: { "x-admin-key": key },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unauthorized");
      setStats(null);
      return;
    }
    setStats(data.stats);
    setOrders(data.recentOrders || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reseed() {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": key,
      },
      body: JSON.stringify({ action: "reseed" }),
    });
    const data = await res.json();
    if (res.ok) {
      await load();
      alert(`Reseeded ${data.count} products`);
    } else {
      setError(data.error || "Failed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-5xl mb-2">
        Admin
      </h1>
      <p className="text-[var(--muted)] mb-8">
        Backend dashboard for products, orders, and messages.
      </p>

      <div className="flex gap-2 mb-8">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="field max-w-xs"
          placeholder="Admin key"
        />
        <button type="button" onClick={load} className="btn-outline">
          Refresh
        </button>
        <button type="button" onClick={reseed} className="btn-primary">
          Reseed products
        </button>
      </div>
      {error && <p className="text-red-700 mb-4">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
            {[
              ["Products", stats.productCount],
              ["Orders", stats.orderCount],
              ["Messages", stats.messageCount],
              ["Subscribers", stats.subscriberCount],
              ["Revenue", formatGBP(stats.revenue)],
            ].map(([label, value]) => (
              <div key={String(label)} className="border border-[var(--line)] bg-white/70 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-[family-name:var(--font-display)]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-3">
            Categories
          </h2>
          <ul className="flex flex-wrap gap-2 mb-10 text-sm">
            {stats.categories.map((c) => (
              <li key={c.name} className="border border-[var(--line)] px-3 py-1">
                {c.name}: {c.count}
              </li>
            ))}
          </ul>

          <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-3">
            Recent orders
          </h2>
          <div className="border border-[var(--line)] divide-y divide-[var(--line)] bg-white/70">
            {orders.length === 0 && (
              <p className="p-4 text-sm text-[var(--muted)]">No orders yet.</p>
            )}
            {orders.map((o) => (
              <div key={o.id} className="p-4 text-sm flex flex-wrap justify-between gap-2">
                <span className="font-mono text-xs">{o.id.slice(0, 8)}…</span>
                <span>{o.email}</span>
                <span>{formatGBP(o.total)}</span>
                <span className="text-[var(--muted)]">{o.created_at}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
