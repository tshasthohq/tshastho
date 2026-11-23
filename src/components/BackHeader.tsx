"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackHeader({ title, className = "" }: { title: string; className?: string }) {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  };
  return (
    <div className={`sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100 ${className}`}>
      <div className="flex items-center gap-3 px-4 h-14">
        <button onClick={goBack} aria-label="Go back" className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition">
          <ArrowLeft size={18} className="text-slate-700" />
        </button>
        <h1 className="flex-1 text-center font-bold text-slate-900 pr-9">{title}</h1>
      </div>
    </div>
  );
}
