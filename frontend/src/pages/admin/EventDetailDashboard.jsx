import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { CertificateStudio } from '../../components/certificate/CertificateStudio';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';
import {
  Calendar,
  Users,
  Users2,
  QrCode,
  Award,
  Mail,
  Edit,
  ExternalLink,
  Download,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Trash2,
  KeyRound,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';

export function EventDetailDashboard() {
  const { id } = useParams();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [volunteerRequests, setVolunteerRequests] = useState([]);
  const [approvedVolunteers, setApprovedVolunteers] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [partSearch, setPartSearch] = useState('');

  // Modals state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [newVolunteerPassword, setNewVolunteerPassword] = useState(null);
  const [copiedPass, setCopiedPass] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/registrations/events/${id}/participants`),
      api.get(`/volunteers/events/${id}/requests`),
      api.get(`/volunteers/events/${id}/approved`),
      api.get(`/emails/logs?eventId=${id}`),
    ])
      .then(([evRes, regRes, reqRes, volRes, mailRes]) => {
        setEvent(evRes.event);
        setRegistrations(regRes.registrations || []);
        setVolunteerRequests(reqRes.requests || []);
        setApprovedVolunteers(volRes.volunteers || []);
        setEmailLogs(mailRes.logs || []);
      })
      .catch(err => console.error('Failed to load event details:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/events/${id}/status`, { status: newStatus });
      toast.success(`Event status updated to ${newStatus}`);
      setEvent(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleResetVolunteerPassword = async () => {
    try {
      const res = await api.post(`/events/${id}/reset-volunteer-password`);
      setNewVolunteerPassword(res.volunteerPassword);
      toast.success('Volunteer access password reset successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to reset volunteer password');
    }
  };

  const handleCleanupPasses = async () => {
    setCleanupLoading(true);
    try {
      const res = await api.post(`/events/${id}/cleanup-passes`);
      toast.success(res.message || 'Pass tokens cleaned up successfully');
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Failed to clean up passes');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted successfully');
      window.location.href = '/admin/events';
    } catch (err) {
      toast.error(err.message || 'Failed to delete event');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRevokePass = async (regId, newStatus) => {
    try {
      await api.patch(`/registrations/${regId}/pass-status`, { passStatus: newStatus });
      toast.success(`Pass updated to ${newStatus}`);
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, passStatus: newStatus } : r));
    } catch (err) {
      toast.error('Failed to update pass status');
    }
  };

  const handleVolunteerRequestStatus = async (requestId, status) => {
    try {
      await api.patch(`/volunteers/requests/${requestId}/status`, { status });
      toast.success(`Volunteer request marked as ${status}`);
      loadAll();
    } catch (err) {
      toast.error('Failed to update volunteer request');
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch(`/api/participants/events/${id}/export/csv`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to download CSV');
      const blob = await res.blob();
      const filename = `${event.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Participants.csv`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Participant roster CSV downloaded');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  if (loading || !event) {
    return <div className="p-8 text-sm text-slate-500">Loading event management hub...</div>;
  }

  const filteredRegistrations = registrations.filter(r => {
    return (
      r.fullName.toLowerCase().includes(partSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(partSearch.toLowerCase()) ||
      r.registrationCode.toLowerCase().includes(partSearch.toLowerCase()) ||
      r.participantIdCode.toLowerCase().includes(partSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Event Top Hub Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={event.status} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{event.category}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">&bull; {event.type}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{event.title}</h1>
          <p className="text-xs text-slate-500">
            {event.organizationName} &bull; Held on {new Date(event.eventDate).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={event.status}
            onChange={e => handleStatusChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-700 outline-none"
          >
            <option value="DRAFT">Draft</option>
            <option value="REGISTRATION_OPEN">Registration Open</option>
            <option value="REGISTRATION_CLOSED">Registration Closed</option>
            <option value="EVENT_LIVE">Event Live</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <Link
            to={`/events/${event.slug}`}
            target="_blank"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Page</span>
          </Link>

          <Link
            to={`/admin/events/${event.id}/edit`}
            className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5"
            title="Delete Event"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: Calendar },
          { id: 'participants', label: `Participants (${registrations.length})`, icon: Users },
          { id: 'volunteers', label: `Volunteers (${approvedVolunteers.length})`, icon: QrCode },
          { id: 'certificates', label: 'Certificates Studio', icon: Award },
          { id: 'emails', label: `Email Logs (${emailLogs.length})`, icon: Mail },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registrations</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{registrations.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Cap: {event.maxRegistrations || 'Unlimited'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Passes</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {registrations.filter(r => r.passStatus === 'ACTIVE').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Encrypted QR passes issued</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved Staff</span>
              <div className="text-2xl font-black text-indigo-600 mt-1">{approvedVolunteers.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {volunteerRequests.filter(r => r.status === 'PENDING').length} pending requests
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Certificates Conferred</span>
              <div className="text-2xl font-black text-purple-600 mt-1">
                {event._count?.certificates || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Verifiable on public portal</div>
            </div>
          </div>

          {/* Pass Cleanup & Lifecycle Management Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>12-Hour Pass Token Cleanup</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Expired event pass tokens are safely expired. Certificates, participant records, and verification links are strictly preserved.
                </p>
                {event.passesCleanedAt && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Pass data cleaned on: {new Date(event.passesCleanedAt).toLocaleString()}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleCleanupPasses}
                disabled={cleanupLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{cleanupLoading ? 'Cleaning Passes...' : 'Run Pass Cleanup Now'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Zero-Attendance Policy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This event operates strictly under a <strong>Zero-Attendance model</strong>. Scanning participant passes authenticates credential validity (VALID, REVOKED, CANCELLED) and never logs attendance, presence, check-in timestamps, or headcounts.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <input
              type="text"
              value={partSearch}
              onChange={e => setPartSearch(e.target.value)}
              placeholder="Search participant name, email, code..."
              className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
            />

            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Participant</th>
                    <th className="py-3.5 px-6">ID</th>
                    <th className="py-3.5 px-6">Reg Code</th>
                    <th className="py-3.5 px-6">Pass Status</th>
                    <th className="py-3.5 px-6 text-right">Pass Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistrations.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {r.fullName}
                        <div className="text-[10px] font-normal text-slate-400">{r.email} &bull; {r.organization}</div>
                      </td>
                      <td className="py-3.5 px-6 font-semibold">{r.participantIdCode}</td>
                      <td className="py-3.5 px-6 font-mono text-blue-700 font-bold">
                        <Link to={`/pass/${r.registrationCode}`} target="_blank" className="hover:underline">
                          {r.registrationCode}
                        </Link>
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusBadge status={r.passStatus} />
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-2">
                        {r.passStatus === 'ACTIVE' ? (
                          <button
                            onClick={() => handleRevokePass(r.id, 'REVOKED')}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-bold transition"
                          >
                            Revoke Pass
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRevokePass(r.id, 'ACTIVE')}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition"
                          >
                            Reactivate Pass
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
      )}

      {/* TAB 3: VOLUNTEERS */}
      {activeTab === 'volunteers' && (
        <div className="space-y-6">
          {/* Volunteer Access Control Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Volunteer Scanner Access Password</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Authorized volunteers login at <code>/volunteer/login</code> using this event's slug and password to scan participant passes.
              </p>
            </div>

            <button
              onClick={handleResetVolunteerPassword}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Reset Volunteer Password</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Volunteer Requests from Registrants</h3>
            {volunteerRequests.length === 0 ? (
              <p className="text-xs text-slate-400">No pending volunteer applications for this event.</p>
            ) : (
              <div className="space-y-3">
                {volunteerRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{req.name}</div>
                      <div className="text-slate-500">{req.email} &bull; ID: {req.participantIdCode}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={req.status} />
                      {req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleVolunteerRequestStatus(req.id, 'ACCEPTED')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVolunteerRequestStatus(req.id, 'REJECTED')}
                            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl font-bold text-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Authorized Volunteer Staff</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {approvedVolunteers.map(v => (
                <div key={v.id} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{v.name}</div>
                  <div className="text-slate-500">{v.email}</div>
                  <div className="font-mono text-emerald-800 font-bold pt-1">Code: {v.volunteerIdCode}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CERTIFICATES STUDIO */}
      {activeTab === 'certificates' && (
        <CertificateStudio
          event={event}
          registrations={registrations}
          teams={event.teams || []}
        />
      )}

      {/* TAB 5: EMAIL LOGS */}
      {activeTab === 'emails' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <h3 className="font-bold text-sm text-slate-900">Email Dispatch Audit Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emailLogs.map(log => (
                  <tr key={log.id}>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.recipientEmail}</td>
                    <td className="py-3 px-4 truncate max-w-xs">{log.subject}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[10px]">{log.emailType}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="py-3 px-4">{new Date(log.sentAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {newVolunteerPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">New Volunteer Password</h3>
              <p className="text-xs text-slate-500 mt-1">
                Share this password with your staff volunteers. They will use this password alongside the event slug (<strong>{event.slug}</strong>) to log in to the QR pass scanner.
              </p>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between font-mono font-bold text-lg tracking-wider">
              <span>{newVolunteerPassword}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(newVolunteerPassword);
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 2000);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1 text-xs font-sans"
              >
                {copiedPass ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPass ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setNewVolunteerPassword(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Delete Event Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEvent}
        eventName={event.title}
        loading={deleteLoading}
      />
    </div>
  );
}
