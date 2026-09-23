"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = ["CUSTOMER", "TRADE", "STAFF", "ADMIN", "SUPER_ADMIN"] as const;

export function RoleChangeForm({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (role === currentRole) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="text-xs border border-[color:var(--admin-border,#e5e7eb)] rounded px-1 py-1"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="text-xs underline"
        disabled={pending || role === currentRole}
        onClick={save}
      >
        Save
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
