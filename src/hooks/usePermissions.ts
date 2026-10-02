"use client";
import { useEffect, useState } from "react";

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    const staffRole = localStorage.getItem("staffRole") || "";
    setRole(staffRole || role);

    // Owner (PHARMACY_OWNER) gets all permissions
    if (role === "PHARMACY_OWNER") {
      // All permissions - import dynamically to avoid circular
      const allKeys = [
        "view_dashboard", "view_orders", "accept_orders", "deliver_orders",
        "view_medicines", "add_medicines", "delete_medicines", "view_inventory",
        "view_customers", "view_dues", "collect_dues", "view_reports",
        "manage_staff", "view_attendance", "manage_settings",
      ];
      setPermissions(allKeys);
    } else if (role === "PHARMACY_STAFF") {
      const perms = localStorage.getItem("userPermissions");
      if (perms) {
        try {
          setPermissions(JSON.parse(perms));
        } catch {
          setPermissions([]);
        }
      }
    }
    setLoading(false);
  }, []);

  const has = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAny = (perms: string[]): boolean => {
    return perms.some(p => permissions.includes(p));
  };

  return { permissions, role, loading, has, hasAny };
}
