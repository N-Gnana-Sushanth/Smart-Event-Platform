import React from 'react';

export function StatusBadge({ status }) {
  const configs = {
    DRAFT: { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-300' },
    REGISTRATION_OPEN: { label: 'Registration Open', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    REGISTRATION_CLOSED: { label: 'Registration Closed', bg: 'bg-amber-50 text-amber-700 border-amber-300' },
    EVENT_LIVE: { label: 'Event Live', bg: 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse' },
    COMPLETED: { label: 'Completed', bg: 'bg-purple-50 text-purple-700 border-purple-300' },
    ARCHIVED: { label: 'Archived', bg: 'bg-slate-200 text-slate-600 border-slate-400' },

    ACTIVE: { label: 'Active Pass', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    REVOKED: { label: 'Revoked', bg: 'bg-rose-50 text-rose-700 border-rose-300' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-slate-200 text-slate-700 border-slate-400' },

    PENDING: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-300' },
    CONTACTED: { label: 'Contacted', bg: 'bg-blue-50 text-blue-700 border-blue-300' },
    ACCEPTED: { label: 'Accepted', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    REJECTED: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-300' },

    SENT: { label: 'Sent', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    FAILED: { label: 'Failed', bg: 'bg-rose-50 text-rose-700 border-rose-300' },

    WINNER: { label: 'Winner', bg: 'bg-amber-100 text-amber-800 border-amber-400 font-bold' },
    PARTICIPANT: { label: 'Participant', bg: 'bg-blue-50 text-blue-700 border-blue-300' },
  };

  const current = configs[status] || { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-300' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}>
      {current.label}
    </span>
  );
}
