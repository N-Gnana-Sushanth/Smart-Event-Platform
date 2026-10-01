import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Users2,
  QrCode,
  Award,
  Mail,
  Settings,
  LogOut,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: 'Participants', path: '/admin/participants', icon: Users },
    { name: 'Teams', path: '/admin/teams', icon: Users2 },
    { name: 'Volunteers', path: '/admin/volunteers', icon: QrCode },
    { name: 'QR Verification', path: '/volunteer/scanner', icon: QrCode, isScanner: true },
    { name: 'Certificates Studio', path: '/admin/certificates', icon: Award },
    { name: 'Email Logs', path: '/admin/emails', icon: Mail },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            SE
          </div>
          <div>
            <div className="text-white font-extrabold text-sm tracking-tight">SmartEvent</div>
            <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Organizer Portal</div>
          </div>
        </Link>
      </div>

      {/* Quick Action */}
      <div className="p-4">
        <Link
          to="/admin/events/new"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Event</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
              {item.isScanner && (
                <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Staff
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-white text-sm font-semibold truncate">{user?.name || 'Administrator'}</div>
            <div className="text-slate-500 text-xs truncate">{user?.email || 'admin@smartevent.com'}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to="/"
            target="_blank"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
