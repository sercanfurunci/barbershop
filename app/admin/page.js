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
    router.replace(slug ? `/${slug}/admin` : "/superadmin/login");
  }, [loaded, user, router]);
  return null;
}
