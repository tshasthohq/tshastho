import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export type LegalSection = { h: string; p?: string[]; list?: string[] };

export default function LegalPage({
  title, updated, intro, sections,
}: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 mb-6">
          <ArrowLeft size={16} /> Home
        </Link>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2">{title}</h1>
        <p className="text-sm text-slate-400 mb-6">Last updated: {updated}</p>
        <p className="text-slate-600 leading-relaxed mb-8">{intro}</p>
        <div className="space-y-4">
          {sections.map((s, i) => (
            <section key={s.h} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
              <h2 className="font-bold text-lg text-slate-900 mb-2">{i + 1}. {s.h}</h2>
              {s.p?.map((x) => (
                <p key={x} className="text-slate-600 leading-relaxed mb-2">{x}</p>
              ))}
              {s.list && (
                <ul className="list-disc ps-5 space-y-1 text-slate-600">
                  {s.list.map((x) => <li key={x}>{x}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-500">
          Questions? <Link href="/contact" className="text-blue-600 font-semibold">Contact us</Link>.
        </p>
      </div>
    </main>
  );
}
