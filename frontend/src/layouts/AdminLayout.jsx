import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, ShieldCheck } from 'lucide-react';

export function AdminLayout() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Validating organizer session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {user?.organization || 'Global Organization'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/volunteer/scanner"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Launch Pass Scanner</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
              <span className="text-xs text-slate-500">({user?.email})</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/admin/login';
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
              title="Logout from Admin"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
