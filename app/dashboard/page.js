"use client";

// /dashboard — canonical business dashboard entry point.
// Reads the active tenant from the authenticated session
// and redirects to the correct /{slug}/admin path.
// This decouples the URL from the tenant name for future multi-tenant expansions.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardRedirect() {
  const { user, loaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;
    if (!user) { router.replace("/business/login"); return; }
    if (user.role === "CUSTOMER") { router.replace("/account"); return; }
    if (user.role === "SUPER_ADMIN") { router.replace("/superadmin"); return; }
    if (user.role === "BARBER" && user.barber?.slug && user.shop?.slug) {
      router.replace(`/${user.shop.slug}/barber/${user.barber.slug}`);
      return;
    }
    const slug = user.shop?.slug;
    router.replace(slug ? `/${slug}/admin` : "/business/login");
  }, [loaded, user, router]);

  return null;
}
