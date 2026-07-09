"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Auto-logins as the demo business account and redirects to the demo dashboard.
export default function DemoButton({ className, children = "Demo Gör" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDemo = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/demo", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.replace(data.redirectTo || "/demo/admin");
    } catch {
      // Fallback: just show the demo landing page
      router.push("/demo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDemo} disabled={loading} className={className}>
      {loading ? "Yükleniyor…" : children}
    </button>
  );
}
