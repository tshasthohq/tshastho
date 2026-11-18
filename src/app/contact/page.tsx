"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  const [s, setS] = useState<any>({});

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: any) => setS(d.settings || d.data || d || {}))
      .catch(() => {});
  }, []);

  const hotline = s.hotlineNumber || "";
  const email = s.supportEmail || s.contactEmail || s.email || "";
  const address = s.address || s.contactAddress || "";
  const nothing = !hotline && !email && !address;

  const rows = [
    hotline && { Icon: Phone, label: "Hotline", value: hotline, href: `tel:${hotline}` },
    email && { Icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    address && { Icon: MapPin, label: "Address", value: address, href: "" },
  ].filter(Boolean) as any[];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-xl mx-auto px-4 py-6 md:py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 mb-6">
          <ArrowLeft size={16} /> Home
        </Link>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2">Contact Us</h1>
        <p className="text-slate-500 mb-6">We are here to help with appointments, orders and your account.</p>

        <div className="space-y-3">
          {rows.map(({ Icon, label, value, href }) => {
            const inner = (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="font-bold text-slate-900 break-words">{value}</p>
                </div>
              </div>
            );
            return href ? <a key={label} href={href}>{inner}</a> : <div key={label}>{inner}</div>;
          })}
          {nothing && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 text-slate-500 text-sm">
              Contact details will appear here soon.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
