import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { QrCode, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export function VolunteersManagement() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/events')
      .then(data => {
        const list = data.events || [];
        setEvents(list);
        if (list.length > 0) setSelectedEventId(list[0].id);
      })
      .catch(console.error);
  }, []);

  const loadData = () => {
    if (!selectedEventId) return;
    setLoading(true);
    Promise.all([
      api.get(`/volunteers/events/${selectedEventId}/requests`),
      api.get(`/volunteers/events/${selectedEventId}/approved`),
    ])
      .then(([reqRes, volRes]) => {
        setRequests(reqRes.requests || []);
        setVolunteers(volRes.volunteers || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedEventId]);

  const handleUpdate = async (id, status) => {
    try {
      await api.patch(`/volunteers/requests/${id}/status`, { status });
      toast.success(`Request marked as ${status}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update request');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Volunteers & Staff Management</h1>
        <p className="text-xs text-slate-500 mt-1">Review applicant requests and view authorized gate scanner volunteers.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-sm">
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Volunteer Requests ({requests.length})</h3>
          {requests.length === 0 ? (
            <p className="text-xs text-slate-400">No volunteer requests found.</p>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{req.name}</div>
                    <div className="text-slate-500">{req.email} &bull; ID: {req.participantIdCode}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={req.status} />
                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdate(req.id, 'ACCEPTED')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Volunteers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Authorized Gate Staff ({volunteers.length})</h3>
          {volunteers.length === 0 ? (
            <p className="text-xs text-slate-400">No authorized volunteers yet.</p>
          ) : (
            <div className="space-y-3">
              {volunteers.map(v => (
                <div key={v.id} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{v.name}</div>
                    <div className="text-slate-500">{v.email}</div>
                  </div>
                  <div className="font-mono text-emerald-800 font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                    {v.volunteerIdCode}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
