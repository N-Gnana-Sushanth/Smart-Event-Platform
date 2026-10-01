import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { ShieldCheck, Calendar, Award, Heart } from 'lucide-react';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  SE
                </div>
                <span className="font-extrabold text-lg text-slate-900">Smart Event Platform</span>
              </div>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                Global event management & digital credential verification platform for colleges, universities, conferences, hackathons, and communities.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero-attendance model: QR tokens strictly authenticate digital passes and certificates.</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/" className="hover:text-blue-600">Explore Events</Link></li>
                <li><Link to="/portal" className="hover:text-blue-600">My Passes & Credentials</Link></li>
                <li><Link to="/verify/CERT-2026-000101" className="hover:text-blue-600">Public Credential Verification</Link></li>
                <li><Link to="/volunteer/login" className="hover:text-blue-600">Volunteer QR Pass Scanner</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Organizers</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/admin/login" className="hover:text-blue-600">Admin Login</Link></li>
                <li><Link to="/admin/register" className="hover:text-blue-600">Register as Organizer</Link></li>
                <li><Link to="/admin/dashboard" className="hover:text-blue-600">Event Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="my-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <p className="font-medium">
                This site is under development. If you find any mistake or any upgrades, please let us know from the{' '}
                <Link to="/help" className="font-bold underline text-amber-800 hover:text-amber-950">
                  Help section
                </Link>.
              </p>
            </div>
            <Link
              to="/help"
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 transition"
            >
              Report Upgrade / Bug
            </Link>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} Smart Event Platform. Production-Ready Digital Credential Ecosystem.</p>
            <p className="flex items-center gap-1">
              Engineered for global institutions & communities
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
