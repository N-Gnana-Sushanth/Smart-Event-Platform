import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import {
  Calendar,
  MapPin,
  Clock,
  Search,
  Users,
  ShieldCheck,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    api.get('/events/public')
      .then(data => setEvents(data.events || []))
      .catch(err => console.error('Failed to load public events:', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', 'Hackathons', 'Conferences', 'Seminars', 'Workshops', 'Competitions'];

  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.organizationName.toLowerCase().includes(search.toLowerCase()) ||
      e.locationOrLink.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Next-Generation Event Lifecycle & Credential Ecosystem</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Smart Event Management & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400">
              Digital Credential Platform
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Manage registrations, issue secure digital passes, authenticate credentials with zero attendance tracking, and generate AI-designed tamper-proof certificates.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/portal"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              <span>Access My Passes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/verify/CERT-2026-000101"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Verify Certificate</span>
            </Link>
          </div>

          {/* Value Badges */}
          <div className="pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Attendance Privacy Model</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>AI-Assisted Certificate Designs</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Publicly Verifiable Credentials</span>
            </div>
          </div>
        </div>
      </section>

      {/* Events Listing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, organizers, or topics..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
                <div className="h-44 bg-slate-200 rounded-xl" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => {
              const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  <Link to={`/events/${event.slug}`} className="h-48 relative overflow-hidden bg-slate-900 block group/img">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-3xl font-black"
                        style={{ backgroundColor: event.primaryColor || '#1e3a8a' }}
                      >
                        {event.title.charAt(0)}
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={event.status} />
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-sm text-white">
                        {event.category}
                      </span>
                    </div>
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-600 truncate">
                        {event.organizationName}
                      </div>
                      <Link to={`/events/${event.slug}`} className="block">
                        <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600 transition leading-snug">
                          {event.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{eventDate} &bull; {event.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{event.locationOrLink}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{event.isTeamEvent ? `Team Event (Max ${event.maxTeamMembers} members)` : 'Solo Event'}</span>
                      </div>
                    </div>

                    <div className="pt-3">
                      <Link
                        to={`/events/${event.slug}`}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center bg-slate-900 hover:bg-blue-600 text-white transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>View Event & Register</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
