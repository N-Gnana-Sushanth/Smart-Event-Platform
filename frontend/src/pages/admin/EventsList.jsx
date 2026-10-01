import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { PlusCircle, Search, Calendar, Users, Award, ExternalLink, Trash2, Edit } from 'lucide-react';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

export function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, eventId: null, eventTitle: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();

  const fetchEvents = () => {
    setLoading(true);
    api.get(`/events?status=${statusFilter}&search=${encodeURIComponent(search)}`)
      .then(data => setEvents(data.events || []))
      .catch(err => toast.error('Failed to load events'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const confirmDelete = async () => {
    if (!deleteModal.eventId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/events/${deleteModal.eventId}`);
      toast.success('Event deleted successfully');
      setEvents(prev => prev.filter(e => e.id !== deleteModal.eventId));
      setDeleteModal({ isOpen: false, eventId: null, eventTitle: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to delete event');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Events Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage event status lifecycles, registrations, and credentials.</p>
        </div>

        <Link
          to="/admin/events/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Event</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchEvents()}
            placeholder="Search events..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'REGISTRATION_OPEN', 'EVENT_LIVE', 'COMPLETED', 'DRAFT'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Event Name</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Registrations</th>
                <th className="py-3.5 px-6">Certificates</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map(ev => (
                <tr key={ev.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    <Link to={`/admin/events/${ev.id}`} className="hover:text-blue-600 truncate block max-w-sm">
                      {ev.title}
                    </Link>
                    <div className="text-[10px] font-normal text-slate-400">{ev.organizationName} &bull; {ev.type}</div>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={ev.status} />
                  </td>
                  <td className="py-4 px-6 font-medium">
                    {new Date(ev.eventDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    {ev._count?.registrations || 0}
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    {ev._count?.certificates || 0}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/events/${ev.id}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition"
                      >
                        Manage
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, eventId: ev.id, eventTitle: ev.title })}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, eventId: null, eventTitle: '' })}
        onConfirm={confirmDelete}
        eventName={deleteModal.eventTitle}
        loading={deleteLoading}
      />
    </div>
  );
}
