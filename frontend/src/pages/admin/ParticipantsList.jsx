import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { Search, Download, ExternalLink, ShieldCheck } from 'lucide-react';

export function ParticipantsList() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    api.get('/events')
      .then(data => {
        const list = data.events || [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(list[0].id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      setLoading(true);
      api.get(`/registrations/events/${selectedEventId}/participants`)
        .then(data => setParticipants(data.registrations || []))
        .catch(err => toast.error('Failed to load participants'))
        .finally(() => setLoading(false));
    }
  }, [selectedEventId]);

  const handleRevoke = async (id, status) => {
    try {
      await api.patch(`/registrations/${id}/pass-status`, { passStatus: status });
      toast.success(`Pass updated to ${status}`);
      setParticipants(prev => prev.map(p => p.id === id ? { ...p, passStatus: status } : p));
    } catch (err) {
      toast.error('Failed to update pass');
    }
  };

  const handleExport = async () => {
    if (!selectedEventId) return;
    try {
      const blob = await api.get(`/participants/events/${selectedEventId}/export/csv`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants_${selectedEventId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Roster exported');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const filtered = participants.filter(p =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.registrationCode.toLowerCase().includes(search.toLowerCase()) ||
    p.participantIdCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Participants Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse registered participants, examine digital credentials, and manage pass active/revoked states.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search participants..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Participant</th>
                <th className="py-3.5 px-6">Participant ID</th>
                <th className="py-3.5 px-6">Registration Code</th>
                <th className="py-3.5 px-6">Team</th>
                <th className="py-3.5 px-6">Pass Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-6 font-bold text-slate-900">
                    {p.fullName}
                    <div className="text-[10px] font-normal text-slate-400">{p.email} ? {p.organization}</div>
                  </td>
                  <td className="py-3.5 px-6 font-semibold">{p.participantIdCode}</td>
                  <td className="py-3.5 px-6 font-mono text-blue-700 font-bold">
                    <Link to={`/pass/${p.registrationCode}`} target="_blank" className="hover:underline">
                      {p.registrationCode}
                    </Link>
                  </td>
                  <td className="py-3.5 px-6">{p.team?.teamName || 'Solo'}</td>
                  <td className="py-3.5 px-6">
                    <StatusBadge status={p.passStatus} />
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-2">
                    {p.passStatus === 'ACTIVE' ? (
                      <button
                        onClick={() => handleRevoke(p.id, 'REVOKED')}
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-bold"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRevoke(p.id, 'ACTIVE')}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold"
                      >
                        Activate
                      </button>
                    )}
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
