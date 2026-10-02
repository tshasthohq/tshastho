import Link from "next/link";
import { Search, CalendarCheck, Video, Star } from "lucide-react";

export default function Home() {
  const services = [
    { title: "Doctors", icon: "👨‍⚕️", desc: "Book Appointment" },
    { title: "Hospitals", icon: "🏥", desc: "Find & Book" },
    { title: "Pharmacies", icon: "💊", desc: "Buy Medicine" },
    { title: "Diagnostics", icon: "🔬", desc: "Book Tests" },
    { title: "Ambulance", icon: "🚑", desc: "Emergency Ride" },
    { title: "Blood Bank", icon: "🩸", desc: "Find Donors" },
    { title: "Home Healthcare", icon: "🏠", desc: "Nursing & Care" },
    { title: "International", icon: "🌍", desc: "Global Hospitals" },
    { title: "Health Packages", icon: "📋", desc: "Checkup Offers" },
    { title: "Medical Equipment", icon: "🩺", desc: "Rent or Buy" },
    { title: "Health Insurance", icon: "🛡️", desc: "Coverage Plans" },
    { title: "Telemedicine", icon: "📹", desc: "Video Consult" },
    { title: "Vaccination", icon: "💉", desc: "Book Vaccine" },
  ];

  const doctors = [
    { name: "Dr. Sarah Mitchell", specialty: "Cardiologist", rating: 4.9, image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200" },
    { name: "Prof. James Wilson", specialty: "Orthopedic", rating: 4.8, image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200" },
    { name: "Dr. Aisha Rahman", specialty: "Neurologist", rating: 4.7, image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200" },
    { name: "Dr. Michael Chen", specialty: "Pediatrician", rating: 4.8, image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">Tshastho</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600">Login</Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-cyan-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            All Your Healthcare <br className="hidden md:block" />
            Needs in <span className="text-blue-600">One Place</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            Book doctors, order medicines, find hospitals, and more — from anywhere in Bangladesh and around the world.
          </p>
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-2 flex flex-col md:flex-row gap-2">
            <input type="text" placeholder="Search doctor, hospital, test..." className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition">Search</button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Our Services</h2>
          <p className="text-center text-slate-500 mb-12">Everything you need, in one place.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div key={index} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition text-center">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{service.title}</h3>
                <p className="text-sm text-slate-500">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Search size={32} /></div>
              <h3 className="text-xl font-semibold mb-2">1. Search</h3>
              <p className="text-slate-500">Find the right doctor, hospital, or service near you.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><CalendarCheck size={32} /></div>
              <h3 className="text-xl font-semibold mb-2">2. Book</h3>
              <p className="text-slate-500">Choose a date, time, and confirm your booking instantly.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Video size={32} /></div>
              <h3 className="text-xl font-semibold mb-2">3. Consult</h3>
              <p className="text-slate-500">Visit the doctor or consult via video call from home.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Doctors Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Top Doctors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {doctors.map((doctor, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition">
                <img src={doctor.image} alt={doctor.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800">{doctor.name}</h3>
                  <p className="text-sm text-slate-500">{doctor.specialty}</p>
                  <div className="flex items-center gap-1 mt-2 text-yellow-500 text-sm">
                    <Star size={16} fill="currentColor" /> {doctor.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Healthcare Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Global Healthcare Now at Your Fingertips</h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">Book appointments with top doctors and hospitals from USA, UK, India, Malaysia, Singapore and more.</p>
          <Link href="/international" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition">Explore International</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 text-center">
        <p>© 2026 Tshastho. All rights reserved.</p>
        <p className="text-sm text-slate-500 mt-2">Better Health, Brighter Tomorrow</p>
      </footer>
    </div>
  );
}
