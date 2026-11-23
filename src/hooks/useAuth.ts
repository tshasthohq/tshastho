"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type AuthUser = {
  avatarUrl?: string | null;
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  address: string | null;
  parentPharmacyId: string | null;
  staffRole: string | null;
  permissions: any;
  patientProfile?: any;
  doctorProfile?: any;
  pharmacyProfile?: any;
};

let inflight: Promise<AuthUser | null> | null = null;
let cached: { at: number; user: AuthUser } | null = null;
const CLIENT_TTL = 5000;

function loadUser(): Promise<AuthUser | null> {
  if (cached && Date.now() - cached.at < CLIENT_TTL) return Promise.resolve(cached.user);
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      const u: AuthUser | null = data.user ?? null;
      if (u) cached = { at: Date.now(), user: u };
      return u;
    } catch {
      return null; // not logged in
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadUser().then((u) => {
      if (!mounted) return;
      setUser(u);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const logout = async () => {
    cached = null;
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      router.push("/login");
    }
  };

  return { user, loading, logout };
}
