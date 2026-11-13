"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  permission: string | string[];
  children: React.ReactNode;
}

export default function PermissionGuard({ permission, children }: Props) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // useAuth থেকে সরাসরি ডাটা নিচ্ছি
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    // ১. অথেনটিকেশন লোড হওয়া পর্যন্ত অপেক্ষা করুন
    if (authLoading) return;

    // ২. ইউজার না থাকলে ডিনাই
    if (!user) {
      setStatus("denied");
      return;
    }

    // ৩. Owner & SuperAdmin সবসময় অ্যালাউড
    if (user.role === "PHARMACY_OWNER" || user.role === "SUPER_ADMIN") {
      setStatus("allowed");
      return;
    }

    // ৪. Staff হলে পারমিশন চেক করুন
    if (user.role === "PHARMACY_STAFF") {
      let perms: string[] = [];
      
      // ডাটাবেস থেকে পারমিশন নিন, না থাকলে localStorage ফলব্যাক
      if (user.permissions && Array.isArray(user.permissions)) {
        perms = user.permissions as string[];
      } else {
        const permsStr = localStorage.getItem("userPermissions");
        try { perms = permsStr ? JSON.parse(permsStr) : []; } catch {}
      }

      const required = Array.isArray(permission) ? permission : [permission];
      // যদি 'all' পারমিশন থাকে অথবা রিকোয়ার্ড পারমিশন থাকে
      const hasAccess = required.some(p => perms.includes(p) || perms.includes('all'));
      
      setStatus(hasAccess ? "allowed" : "denied");
      return;
    }

    // ৫. অন্যান্য রোল ডিনাই
    setStatus("denied");
  }, [permission, user, authLoading]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={40} className="text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-500 mb-1">You don't have permission to view this page.</p>
          <p className="text-[11px] text-slate-400 mb-6 flex items-center justify-center gap-1">
            <Lock size={10} /> Contact your pharmacy owner
          </p>
          <button
            onClick={() => router.push("/pharmacy")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} /> Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
