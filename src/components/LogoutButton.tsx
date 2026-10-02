"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className={`flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium ${className}`}
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}
