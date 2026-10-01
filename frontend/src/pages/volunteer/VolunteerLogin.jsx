import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { QrCode, ShieldCheck, Lock, User, HelpCircle } from 'lucide-react';

export function VolunteerLogin() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [eventPassword, setEventPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginVolunteer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/events/public')
      .then(data => {
        const list = data.events || [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(list[0].slug || list[0].id);
        }
      })
      .catch(err => console.error('Failed to load events for volunteer auth:', err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !identifier || !eventPassword) return;

    setLoading(true);
    try {
      const res = await api.post('/volunteers/authorize', {
        eventSlugOrId: selectedEventId,
        identifier: identifier.trim(),
        eventPassword,
      });

      loginVolunteer(res.volunteer, res.token);
      toast.success(`Authorized as ${res.volunteer.name} for ${res.volunteer.eventTitle}`);
      navigate('/volunteer/scanner');
    } catch (err) {
      toast.error(err.message || 'Volunteer authorization failed. Please check event password and ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <QrCode className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Event Volunteer / QR Verification</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Event volunteers use this scanner to verify a participant's digital pass. It does not record attendance.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Assigned Event *</label>
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {events.length === 0 ? (
                <option value="">No published events available</option>
              ) : (
                events.map(ev => (
                  <option key={ev.id} value={ev.slug || ev.id}>{ev.title}</option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Volunteer ID, Participant ID, or Registered Email *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Enter your Volunteer ID or Email"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Event Volunteer Access Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={eventPassword}
                onChange={e => setEventPassword(e.target.value)}
                placeholder="Enter event volunteer password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{loading ? 'Authorizing...' : 'Authorize & Open Scanner'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Have questions about volunteer access?</span>
          <Link to="/help" className="font-bold text-blue-600 hover:underline">
            Read Help Guide
          </Link>
        </div>
      </div>
    </div>
  );
}
