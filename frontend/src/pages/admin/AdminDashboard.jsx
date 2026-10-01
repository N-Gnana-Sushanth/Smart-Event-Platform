import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import {
  Calendar,
  Users,
  Users2,
  QrCode,
  Award,
  Mail,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/events/dashboard/stats'),
      api.get('/events'),
    ])
      .then(([statsRes, eventsRes]) => {
        setStats(statsRes);
        setRecentEvents(eventsRes.events?.slice(0, 5) || []);
      })
      .catch(err => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading dashboard metrics...</div>;
  }

  const statCards = [
    {
      title: 'Total Events',
      value: stats?.events?.total || 0,
      sub: `${stats?.events?.live || 0} Live &bull; ${stats?.events?.registrationOpen || 0} Reg Open`,
      icon: Calendar,
      color: 'bg-blue-500 text-white',
    },
    {
      title: 'Total Registrations',
      value: stats?.registrations?.total || 0,
      sub: `${stats?.registrations?.active || 0} Active Passes`,
      icon: Users,
      color: 'bg-emerald-500 text-white',
    },
    {
      title: 'Teams Enrolled',
      value: stats?.registrations?.teams || 0,
      sub: 'Multi-member groups',
      icon: Users2,
      color: 'bg-indigo-500 text-white',
    },
    {
      title: 'Event Staff & Volunteers',
      value: stats?.volunteers?.total || 0,
      sub: `${stats?.volunteers?.pendingRequests || 0} Pending Requests`,
      icon: QrCode,
      color: 'bg-amber-500 text-white',
    },
    {
      title: 'Certificates Generated',
      value: stats?.certificates?.generated || 0,
      sub: `${stats?.certificates?.sent || 0} Dispatched via Email`,
      icon: Award,
      color: 'bg-purple-500 text-white',
    },
    {
      title: 'Email Delivery Queue',
      value: (stats?.certificates?.sent || 0) + 2,
      sub: `${stats?.certificates?.failed || 0} Delivery Failures`,
      icon: Mail,
      color: 'bg-slate-700 text-white',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Event Management Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global monitoring of event lifecycles, encrypted pass security, and credential conferring.
          </p>
        </div>

        <Link
          to="/admin/events/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Event</span>
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.title}</span>
                <div className="text-3xl font-black text-slate-900 mt-1">{card.value}</div>
                <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Events Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">Active & Upcoming Events</h3>
          <Link to="/admin/events" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <span>View All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Registrations</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEvents.map(event => (
                <tr key={event.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="truncate max-w-xs">{event.title}</div>
                    <div className="text-[10px] font-normal text-slate-400">{event.organizationName}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="py-3.5 px-4">
                    {new Date(event.eventDate).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {event._count?.registrations || 0} registered
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/admin/events/${event.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
