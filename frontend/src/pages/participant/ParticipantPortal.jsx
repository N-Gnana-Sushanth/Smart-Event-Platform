import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/Badge';
import {
  UserCheck,
  Search,
  Calendar,
  Award,
  ExternalLink,
  QrCode,
  Download,
  Clock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

export function ParticipantPortal() {
  const [email, setEmail] = useState(() => localStorage.getItem('participantEmail') || '');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const toast = useToast();

  const handleLookup = async (lookupEmail) => {
    const clean = (lookupEmail || email).trim().toLowerCase();
    if (!clean) return;

    setLoading(true);
    setSearched(true);
    try {
      localStorage.setItem('participantEmail', clean);
      const data = await api.get(`/participants/lookup?email=${encodeURIComponent(clean)}`);
      setRegistrations(data.registrations || []);
    } catch (err) {
      toast.error('Failed to lookup participant records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email) {
      handleLookup(email);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLookup(email);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Lookup Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <UserCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Events & Credentials</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Access your registered digital passes, QR entrance codes, and official digital certificates across all events.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your registered email address"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Search className="w-4 h-4" />
            <span>Lookup</span>
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Searching credential records...</div>
      ) : searched && registrations.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-md mx-auto space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No registrations found</h3>
          <p className="text-xs text-slate-500">We couldn't find any events registered with {email}.</p>
          <Link to="/" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
            Explore Upcoming Events
          </Link>
        </div>
      ) : registrations.length > 0 ? (
        <div className="space-y-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Registered Events ({registrations.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registrations.map(reg => (
              <div
                key={reg.registrationId}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                {/* Event header */}
                <div
                  className="p-5 text-white"
                  style={{ backgroundColor: reg.event.primaryColor || '#1e3a8a' }}
                >
                  <div className="flex items-center justify-between text-xs opacity-90 mb-1">
                    <span className="font-bold uppercase tracking-wider truncate max-w-[200px]">
                      {reg.event.organizationName}
                    </span>
                    <StatusBadge status={reg.passStatus} />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">{reg.event.title}</h3>
                  <div className="mt-1 text-xs opacity-90">
                    ID: {reg.participantIdCode} &bull; {reg.fullName}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(reg.event.eventDate).toLocaleDateString()} &bull; {reg.event.startTime} ({reg.event.timezone})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{reg.event.locationOrLink}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-slate-400 font-semibold">Registration Code:</span>
                      <span className="font-mono font-bold text-blue-700">{reg.registrationCode}</span>
                    </div>
                  </div>

                  {/* Pass QR Thumbnail */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <img src={reg.qrDataUrl} alt="QR" className="w-14 h-14 bg-white p-1 rounded-lg border border-slate-200" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800">Digital Event Pass</div>
                      <p className="text-[10px] text-slate-500">Scan at entrance for secure credential check.</p>
                      <Link
                        to={`/pass/${reg.registrationCode}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mt-1"
                      >
                        <span>Open Full Pass</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Certificates Section if issued */}
                  {reg.certificates && reg.certificates.length > 0 && (
                    <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>Official Certificate Conferred</span>
                      </div>
                      {reg.certificates.map(cert => (
                        <div key={cert.id} className="flex items-center justify-between text-xs pt-1">
                          <div>
                            <span className="font-bold text-slate-800">{cert.certificateType}</span>
                            {cert.awardPosition && <span className="text-amber-700 ml-1">({cert.awardPosition})</span>}
                            <span className="text-[10px] font-mono text-slate-500 block">{cert.certificateCode}</span>
                          </div>
                          <Link
                            to={`/verify/${cert.certificateCode}`}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold shadow-sm"
                          >
                            Verify & Download
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
