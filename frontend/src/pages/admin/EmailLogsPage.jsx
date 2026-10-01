import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { Mail, RefreshCw, Send, Clock, CheckCircle2 } from 'lucide-react';

export function EmailLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const toast = useToast();

  const fetchLogs = () => {
    setLoading(true);
    api.get(`/emails/logs?status=${filterStatus}`)
      .then(data => setLogs(data.logs || []))
      .catch(err => toast.error('Failed to load email logs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [filterStatus]);

  const handleRetry = async (logId) => {
    try {
      await api.post(`/emails/logs/${logId}/retry`);
      toast.success('Email re-sent successfully');
      fetchLogs();
    } catch (err) {
      toast.error(err.message || 'Retry failed');
    }
  };

  const handleRunReminders = async () => {
    try {
      const res = await api.post('/emails/reminders/run');
      toast.success(`Triggered reminders: ${res.result?.dispatchedCount || 0} emails dispatched.`);
      fetchLogs();
    } catch (err) {
      toast.error('Failed to run reminder job');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Email System & Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track automated welcome emails, 2-hour event reminders, and digital certificate delivery.
          </p>
        </div>

        <button
          onClick={handleRunReminders}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-blue-600/20 self-start sm:self-auto"
        >
          <Clock className="w-4 h-4" />
          <span>Trigger 2-Hour Reminder Check</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['ALL', 'SENT', 'FAILED', 'PENDING'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterStatus === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Recipient</th>
                <th className="py-3.5 px-6">Subject</th>
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-6 font-bold text-slate-900">{log.recipientEmail}</td>
                  <td className="py-3.5 px-6 max-w-xs truncate font-medium text-slate-800">{log.subject}</td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase">{log.emailType}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <StatusBadge status={log.status} />
                    {log.errorMessage && (
                      <div className="text-[10px] text-rose-600 mt-0.5 max-w-xs truncate">{log.errorMessage}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-slate-400">{new Date(log.sentAt).toLocaleString()}</td>
                  <td className="py-3.5 px-6 text-right">
                    {log.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetry(log.id)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
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
