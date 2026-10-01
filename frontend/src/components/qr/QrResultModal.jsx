import React from 'react';
import { Modal } from '../common/Modal';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, User, Users, Calendar, Award } from 'lucide-react';

export function QrResultModal({ isOpen, onClose, result }) {
  if (!result) return null;

  const isValid = result.status === 'VALID';
  const isRevoked = result.status === 'REVOKED';
  const isCancelled = result.status === 'CANCELLED';
  const isInvalid = result.status === 'INVALID' || (!isValid && !isRevoked && !isCancelled);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Credential Verification Result" maxWidth="max-w-lg">
      <div className="space-y-6">
        {/* Status Header Banner */}
        <div
          className={`p-6 rounded-2xl text-center border transition-all ${
            isValid
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20'
              : isRevoked
              ? 'bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-600/20'
              : isCancelled
              ? 'bg-slate-700 text-white border-slate-800'
              : 'bg-amber-500 text-white border-amber-600'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
            {isValid && <CheckCircle2 className="w-10 h-10 text-white" />}
            {isRevoked && <XCircle className="w-10 h-10 text-white" />}
            {isCancelled && <AlertTriangle className="w-10 h-10 text-white" />}
            {isInvalid && <AlertTriangle className="w-10 h-10 text-white" />}
          </div>

          <h2 className="text-2xl font-black tracking-tight uppercase">
            {isValid && 'Valid Registration'}
            {isRevoked && 'Pass Revoked'}
            {isCancelled && 'Registration Cancelled'}
            {isInvalid && 'Invalid QR / Pass Not Found'}
          </h2>
          <p className="text-xs mt-1 opacity-90 font-medium">
            {result.message}
          </p>
        </div>

        {/* Participant Details if found */}
        {result.participant && (
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registration Record
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-lg">
                {result.participant.fullName?.charAt(0) || 'P'}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-base">{result.participant.fullName}</div>
                <div className="text-xs text-slate-500">
                  ID: <span className="font-semibold text-slate-700">{result.participant.participantIdCode}</span> &bull; {result.participant.organization}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-400 block font-semibold">Registration Code:</span>
                <span className="font-mono font-bold text-blue-700 text-sm">{result.participant.registrationCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Event:</span>
                <span className="font-semibold text-slate-800 truncate block">{result.participant.eventTitle}</span>
              </div>
              {result.participant.teamName && (
                <div className="col-span-2">
                  <span className="text-slate-400 block font-semibold">Team:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    {result.participant.teamName} {result.participant.isCaptain && '(Team Captain)'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Anti-attendance footer reminder */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Pass verification confirmed. No attendance record created.</span>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition"
        >
          Scan Next Participant
        </button>
      </div>
    </Modal>
  );
}
