import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  Share2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export function PublicEventPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    api.get(`/events/slug/${slug}`)
      .then(data => setEvent(data.event))
      .catch(err => {
        console.error('Failed to load event:', err);
        toast.error('Event not found');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <Link to="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          Return to Events Directory
        </Link>
      </div>
    );
  }

  const isRegistrationOpen = event.status === 'REGISTRATION_OPEN';
  const eventDateStr = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Event link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Event Header Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200">
        <div className="h-64 sm:h-80 w-full bg-slate-900 relative">
          {event.bannerUrl ? (
            <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-5xl font-black"
              style={{ backgroundColor: event.primaryColor || '#1e3a8a' }}
            >
              {event.title.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={event.status} />
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider">
              {event.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider">
              {event.type}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{event.title}</h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Hosted by <span className="text-white font-bold">{event.organizationName}</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Details + Registration Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">About This Event</h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Date, Time & Venue</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Event Date</span>
                </div>
                <div className="font-semibold text-slate-900 text-sm">{eventDateStr}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Time</span>
                </div>
                <div className="font-semibold text-slate-900 text-sm">{event.startTime} - {event.endTime} ({event.timezone})</div>
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Location or Online Link</span>
                </div>
                <div className="font-semibold text-slate-900 text-sm break-all">{event.locationOrLink}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Contact Organizers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 text-slate-700">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{event.contactEmail}</span>
              </div>
              {event.contactPhone && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 text-slate-700">
                  <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{event.contactPhone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Registration Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg sticky top-24 space-y-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Participation</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {event.isTeamEvent ? 'Team Registration' : 'Solo Registration'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {event.isTeamEvent
                  ? `Assemble a team of up to ${event.maxTeamMembers} members`
                  : 'Individual participant credential'}
              </p>
            </div>

            {isRegistrationOpen ? (
              <Link
                to={`/events/${event.slug}/register`}
                className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm text-center shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
              >
                <span>Register for Event</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 text-center text-xs font-bold">
                Registrations are currently closed for this event
              </div>
            )}

            <button
              onClick={handleShare}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Event Link</span>
            </button>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Encrypted QR Digital Pass</span>
              </div>
              <p>
                Zero attendance tracking. Pass is used solely for identity verification at entrance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
