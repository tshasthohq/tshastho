"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

export function useRequireAuth(allowedRoles?: string[]) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Role not allowed — redirect to their own dashboard
      const routes: Record<string, string> = {
        SUPER_ADMIN: "/admin",
        DOCTOR: "/doctor",
        PHARMACY_OWNER: "/pharmacy",
        PHARMACY_STAFF: "/pharmacy/staff",
        DIAGNOSTIC_OWNER: "/diagnostic",
        HOSPITAL_ADMIN: "/hospital",
        CUSTOMER: "/dashboard",
      };
      router.push(routes[user.role] || "/dashboard");
    }
  }, [user, loading, allowedRoles, router]);

  return { user, loading };
}
