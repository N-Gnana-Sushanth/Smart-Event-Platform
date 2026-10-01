import React from 'react';
import { Calendar, Clock, MapPin, Award, Users, Download, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

export function DigitalPassCard({ pass, event, team }) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  const eventDateStr = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-md mx-auto">
      {/* The Printable Pass Container */}
      <div
        id="printable-pass"
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 transition-all"
        style={{
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.12)',
        }}
      >
        {/* Pass Header Banner */}
        <div
          className="p-6 text-white relative overflow-hidden"
          style={{ backgroundColor: event.primaryColor || '#1e3a8a' }}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              {event.logoUrl ? (
                <img src={event.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover bg-white/20 p-0.5" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
                  {event.organizationName?.charAt(0) || 'E'}
                </div>
              )}
              <span className="text-xs font-bold tracking-wider uppercase opacity-90 truncate max-w-[200px]">
                {event.organizationName}
              </span>
            </div>
            <StatusBadge status={pass.passStatus} />
          </div>

          <div className="mt-4 relative z-10">
            <h2 className="text-xl font-extrabold tracking-tight leading-tight">{event.title}</h2>
            <div className="mt-1 flex items-center gap-2 text-xs opacity-90">
              <span className="px-2 py-0.5 rounded bg-white/20 font-semibold">{event.category}</span>
              <span>&bull;</span>
              <span>{event.type}</span>
            </div>
          </div>

          {/* Decorative subtle circles */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Pass Body */}
        <div className="p-6 space-y-5">
          {/* Participant Header */}
          <div className="border-b border-slate-100 pb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Participant Credential</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">{pass.fullName}</div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
              <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                ID: {pass.participantIdCode}
              </span>
              <span>{pass.organization}</span>
              {team && (
                <span className="flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <Users className="w-3 h-3" /> Team: {team.teamName} {pass.isCaptain && '(Captain)'}
                </span>
              )}
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Event Date</span>
              </div>
              <div className="font-bold text-slate-800">{eventDateStr}</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Time & Zone</span>
              </div>
              <div className="font-bold text-slate-800">{event.startTime} ({event.timezone})</div>
            </div>

            <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Venue / Online Access</span>
              </div>
              <div className="font-bold text-slate-800 break-all">{event.locationOrLink}</div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="pt-2 flex flex-col items-center justify-center border-t border-dashed border-slate-200">
            <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block">
              {pass.qrDataUrl ? (
                <img
                  src={pass.qrDataUrl}
                  alt="Secure QR Code"
                  className="w-44 h-44 object-contain"
                />
              ) : (
                <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="mt-3 text-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Registration Code</div>
              <div className="text-sm font-black font-mono tracking-wider text-blue-700 bg-blue-50/80 px-3 py-1 rounded-lg border border-blue-200 mt-0.5 inline-block">
                {pass.registrationCode}
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-400 text-center flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Encrypted pass credential. QR verified at entrance by staff.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons (Excluded from print via CSS) */}
      <div className="mt-6 flex gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print Pass</span>
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition"
        >
          <Download className="w-4 h-4" />
          <span>Save PDF / Print</span>
        </button>
      </div>
    </div>
  );
}
