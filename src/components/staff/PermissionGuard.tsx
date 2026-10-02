"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";

interface Props {
  permission: string | string[];
  children: React.ReactNode;
}

export default function PermissionGuard({ permission, children }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    
    // Owner & SuperAdmin always allowed
    if (role === "PHARMACY_OWNER" || role === "SUPER_ADMIN") {
      setStatus("allowed");
      return;
    }

    // Staff - check permissions
    if (role === "PHARMACY_STAFF") {
      const permsStr = localStorage.getItem("userPermissions");
      let perms: string[] = [];
      try { perms = permsStr ? JSON.parse(permsStr) : []; } catch {}
      
      const required = Array.isArray(permission) ? permission : [permission];
      const hasAccess = required.some(p => perms.includes(p));
      setStatus(hasAccess ? "allowed" : "denied");
      return;
    }

    // Other roles - deny
    setStatus("denied");
  }, [permission]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Checking access...</div>;
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={40} className="text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-500 mb-1">
            You don't have permission to view this page.
          </p>
          <p className="text-[11px] text-slate-400 mb-6 flex items-center justify-center gap-1">
            <Lock size={10} /> Contact your pharmacy owner
          </p>
          <button
            onClick={() => router.push("/pharmacy")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
