import Link from "next/link";
import { ArrowLeft, Stethoscope, Pill, TestTube, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "About Tshastho",
  description: "Tshastho is a connected healthcare platform for patients, doctors and pharmacies in Bangladesh.",
};

const points = [
  { Icon: Stethoscope, title: "Verified doctors", text: "Book appointments with doctors whose profiles are reviewed before they are listed." },
  { Icon: Pill, title: "Medicines delivered", text: "Order from registered pharmacies and track your order from your dashboard." },
  { Icon: TestTube, title: "Tests & diagnostics", text: "Find diagnostic services and keep your reports and prescriptions in one place." },
  { Icon: ShieldCheck, title: "Your data, protected", text: "Your health information stays private. Read our Privacy Policy for details." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 mb-6">
          <ArrowLeft size={16} /> Home
        </Link>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-3">About Tshastho</h1>
        <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-8">
          Tshastho is a connected healthcare platform for Bangladesh. We bring patients, doctors,
          pharmacies and diagnostic services together in one place, so getting care is simpler,
          faster and more transparent.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {points.map(({ Icon, title, text }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Icon size={22} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{title}</h2>
                <p className="text-sm text-slate-500 mt-1">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/doctors" className="bg-blue-600 text-white font-bold px-5 py-3 rounded-full text-sm">Find a Doctor</Link>
          <Link href="/contact" className="bg-white border border-slate-200 text-slate-700 font-bold px-5 py-3 rounded-full text-sm">Contact Us</Link>
        </div>
      </div>
    </main>
  );
}
