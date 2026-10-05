"use client";

import DoctorNav from "@/components/doctor/DoctorNav";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <DoctorNav />
      <main className="pb-20">{children}</main>
    </div>
  );
}
