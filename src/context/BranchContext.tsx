"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth"; // 👈 Imported useAuth

type Branch = {
  id: string;
  name: string;
  isMain?: boolean; 
  code?: string;
  isGlobal?: boolean;
};

type BranchContextType = {
  branches: Branch[];
  activeBranch: Branch | null;
  setActiveBranch: (branch: Branch) => void;
  loading: boolean;
  error: string | null;
};

const BranchContext = createContext<BranchContextType | undefined>(undefined);
const GLOBAL_BRANCH: Branch = { id: "ALL", name: "All Branches (Global)", isGlobal: true };

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return; // Wait for auth to load

    async function fetchBranches() {
      try {
        const res = await fetch("/api/pharmacy/branches", { credentials: "include", cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.branches || []);
          
          // 🔥 Only show Global option to Owners
          const isOwner = user?.role === 'PHARMACY_OWNER' || user?.role === 'SUPER_ADMIN';
          const displayList = isOwner ? [GLOBAL_BRANCH, ...list] : list;
          
          setBranches(displayList);
          
          const savedBranchId = localStorage.getItem("activeBranchId");
          const savedBranch = displayList.find((b: Branch) => b.id === savedBranchId);
          
          // Default to global for owner, or first branch for staff
          const defaultBranch = isOwner ? GLOBAL_BRANCH : list[0];
          
          setActiveBranchState(savedBranch || defaultBranch || null);
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.message || "Failed to load branches API");
        }
      } catch (err: any) {
        setError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, [user]);

  const setActiveBranch = (branch: Branch) => {
    setActiveBranchState(branch);
    localStorage.setItem("activeBranchId", branch.id);
  };

  return (
    <BranchContext.Provider value={{ branches, activeBranch, setActiveBranch, loading, error }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}
