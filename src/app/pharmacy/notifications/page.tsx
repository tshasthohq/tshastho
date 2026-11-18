"use client";
import NotificationsView from "@/components/NotificationsView";

export default function PharmacyNotificationsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NotificationsView backHref="/pharmacy" />
    </div>
  );
}
