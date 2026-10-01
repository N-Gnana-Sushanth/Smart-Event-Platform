import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Award, ShieldCheck } from 'lucide-react';

export function CertificatePreview({
  certificate = {},
  event = {},
  templateConfig = {},
}) {
  const primaryColor = templateConfig.primaryColor || event.primaryColor || '#1e3a8a';
  const accentColor = templateConfig.accentColor || '#d97706';
  const isWinner = certificate.certificateType === 'WINNER';
  const recipientName = certificate.recipientName || 'Alex Morgan';
  const certCode = certificate.certificateCode || 'CERT-2026-SAMPLE';

  let sigNames = ['Dr. Event Director', 'Academic Program Dean'];
  try {
    if (event.signatureNamesJson) {
      const parsed = JSON.parse(event.signatureNamesJson);
      if (Array.isArray(parsed) && parsed.length > 0) sigNames = parsed;
    }
  } catch (e) {}

  const issueDateStr = new Date(certificate.issueDate || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-8 border border-slate-200 overflow-hidden select-none">
      {/* Outer Certificate Frame */}
      <div
        className="p-6 sm:p-10 rounded-xl relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-blue-50/20"
        style={{
          border: `4px double ${primaryColor}`,
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.03)',
        }}
      >
        {/* Inner Gold Inset Border */}
        <div
          className="absolute inset-3 border pointer-events-none rounded-lg"
          style={{ borderColor: accentColor, opacity: 0.6 }}
        />

        {/* Top Header: Organization */}
        <div className="text-center relative z-10">
          <div
            className="text-xs sm:text-sm font-extrabold uppercase tracking-widest"
            style={{ color: primaryColor }}
          >
            {event.organizationName || 'GLOBAL CREDENTIAL AUTHORITY'}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold tracking-wider mt-0.5 uppercase">
            Official Academic & Professional Credential
          </div>
        </div>

        {/* Main Certificate Title */}
        <div className="text-center my-6 sm:my-8 relative z-10">
          <h1
            className="font-serif text-2xl sm:text-4xl font-bold tracking-tight"
            style={{ color: isWinner ? accentColor : primaryColor }}
          >
            {isWinner ? 'Certificate of Achievement' : 'Certificate of Participation'}
          </h1>

          {isWinner && certificate.awardPosition && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-2"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}40` }}
            >
              <Award className="w-4 h-4" />
              <span>&#9733; {certificate.awardPosition} &#9733;</span>
            </div>
          )}
        </div>

        {/* Recipient Section */}
        <div className="text-center relative z-10 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
            This is proudly conferred upon
          </p>
          <div className="font-serif text-2xl sm:text-4xl font-black text-slate-900 border-b-2 pb-2 inline-block px-8" style={{ borderColor: accentColor }}>
            {recipientName}
          </div>
          <p className="text-xs sm:text-sm text-slate-700 italic mt-4 leading-relaxed">
            {isWinner
              ? `for remarkable excellence and distinction in securing ${certificate.awardPosition || 'honors'} during ${event.title || 'the event'}.`
              : `for active engagement, dedication, and successful completion of ${event.title || 'the event'}.`}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Held on {new Date(event.eventDate || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} &bull; Category: {event.category || 'General'}
          </p>
        </div>

        {/* Footer: Signatures & QR Code */}
        <div className="mt-10 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          {/* Signatory 1 */}
          <div className="text-center sm:text-left">
            <div className="w-36 h-0.5 bg-slate-300 mx-auto sm:mx-0 mb-1" />
            <div className="text-xs font-bold text-slate-800">{sigNames[0]}</div>
            <div className="text-[10px] text-slate-400 font-medium">Event Director</div>
          </div>

          {/* Center QR Verification */}
          <div className="flex flex-col items-center">
            <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-200">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/verify/${certCode}`}
                size={64}
                level="M"
              />
            </div>
            <span className="text-[9px] font-mono font-bold text-blue-700 mt-1">{certCode}</span>
            <span className="text-[8px] text-slate-400">Scan to Verify Credential</span>
          </div>

          {/* Signatory 2 */}
          <div className="text-center sm:text-right">
            <div className="w-36 h-0.5 bg-slate-300 mx-auto sm:ml-auto mb-1" />
            <div className="text-xs font-bold text-slate-800">{sigNames[1]}</div>
            <div className="text-[10px] text-slate-400 font-medium">Issued: {issueDateStr}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
