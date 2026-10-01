import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Award, QrCode, UserCheck, ShieldCheck, Compass, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const location = useLocation();
  const { isAuthenticated, user, volunteer, logout, volunteerLogout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">SmartEvent</span>
              <span className="text-xs text-blue-600 font-semibold block -mt-1 tracking-wider uppercase">Credentials</span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg transition hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-1.5 ${
                location.pathname === '/' ? 'text-blue-600 bg-blue-50/80 font-semibold' : ''
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore Events
            </Link>

            <Link
              to="/portal"
              className={`px-3 py-2 rounded-lg transition hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-1.5 ${
                location.pathname === '/portal' ? 'text-blue-600 bg-blue-50/80 font-semibold' : ''
              }`}
            >
              <UserCheck className="w-4 h-4" />
              My Passes & Events
            </Link>

            <Link
              to="/verify"
              className={`px-3 py-2 rounded-lg transition hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-1.5 ${
                location.pathname.startsWith('/verify') ? 'text-blue-600 bg-blue-50/80 font-semibold' : ''
              }`}
            >
              <Award className="w-4 h-4" />
              Verify Certificate
            </Link>

            <Link
              to="/volunteer/login"
              className={`px-3 py-2 rounded-lg transition hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-1.5 ${
                location.pathname.startsWith('/volunteer') ? 'text-blue-600 bg-blue-50/80 font-semibold' : ''
              }`}
            >
              <QrCode className="w-4 h-4" />
              Volunteer Scanner
            </Link>

            <Link
              to="/help"
              className={`px-3 py-2 rounded-lg transition hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-1.5 ${
                location.pathname === '/help' ? 'text-blue-600 bg-blue-50/80 font-semibold' : ''
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Help & Support
            </Link>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Admin Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : volunteer ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/volunteer/scanner"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scanner ({volunteer.name})</span>
                </Link>
                <button
                  onClick={volunteerLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                  title="Sign Out Volunteer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Organizer Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
