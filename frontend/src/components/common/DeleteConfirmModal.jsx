import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  eventName,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Delete Event?</h3>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm text-slate-800 break-words">
            "{eventName}"
          </div>
          <div className="space-y-1.5 pt-1 text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-rose-600">
              Warning: This action is permanent and cannot be undone.
            </p>
            <p>
              Deleting this event will remove its registration rosters, pass tokens, custom fields, and email logs from the system.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Deleting...' : 'Delete Event'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
