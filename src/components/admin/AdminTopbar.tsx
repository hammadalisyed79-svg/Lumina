"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminTopbar({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/admin/search?q=${encodeURIComponent(query)}` : "/admin/search");
  }

  return (
    <header className="admin-topbar">
      <form onSubmit={onSearch} className="admin-search">
        <input
          type="search"
          placeholder="Search orders, products, customers…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Admin search"
        />
      </form>
      <div className="admin-topbar-right">
        <Link href="/" className="admin-link-muted" target="_blank">
          Storefront
        </Link>
        <div className="admin-profile">
          <span className="admin-profile-name">{name || email}</span>
          <span className="admin-profile-email">{email}</span>
        </div>
      </div>
    </header>
  );
}
