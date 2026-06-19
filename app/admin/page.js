"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminRedirect() {
  const { user, loaded } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loaded) return;
    const slug = user?.shop?.slug;
    if (!slug) { router.replace("/"); return; }
    // Barbers land on their own dashboard, not the admin panel
    const { role, barber } = user ?? {};
    if (role === "BARBER" && barber?.slug) { router.replace(`/${slug}/barber/${barber.slug}`); return; }
    router.replace(`/${slug}/admin`);
  }, [loaded, user, router]);
  return null;
}
