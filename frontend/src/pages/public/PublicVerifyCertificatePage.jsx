import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Award,
  Search,
} from 'lucide-react';

export function PublicVerifyCertificatePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [certCodeInput, setCertCodeInput] = useState(code || '');
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVerification = async (searchCode) => {
    if (!searchCode) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/certificates/verify/${searchCode.trim()}`);
      setCertData(data);
    } catch (err) {
      setError(err.message || 'Certificate verification failed');
      setCertData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      setCertCodeInput(code);
      fetchVerification(code);
    }
  }, [code]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (certCodeInput.trim()) {
      navigate(`/verify/${certCodeInput.trim()}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Public Credential Verification</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Verify the authenticity of digital certificates issued across global conferences, hackathons, and universities.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={certCodeInput}
            onChange={e => setCertCodeInput(e.target.value)}
            placeholder="e.g. CERT-2026-000101"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Verify</span>
          </button>
        </form>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Validating cryptographic credential...</div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center space-y-2">
          <XCircle className="w-12 h-12 text-rose-600 mx-auto" />
          <h3 className="text-lg font-bold text-rose-900">Certificate Not Found / Invalid ID</h3>
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      ) : certData ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-6">
          <div className="bg-emerald-600 text-white p-6 sm:p-8 text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Certificate Verified</h2>
            <p className="text-xs text-emerald-100 font-medium">
              This credential is valid, authentic, and registered in the immutable platform directory.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recipient Conferred</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{certData.certificate.recipientName}</div>
              <div className="text-xs text-slate-500 mt-0.5">{certData.participant.organization}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold block">Issuing Organization:</span>
                <span className="font-bold text-slate-800 text-sm">{certData.event.organizationName}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold block">Event Title:</span>
                <span className="font-bold text-slate-800 text-sm truncate block">{certData.event.title}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold block">Credential Classification:</span>
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  {certData.certificate.certificateType}
                  {certData.certificate.awardPosition && ` (${certData.certificate.awardPosition})`}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold block">Certificate ID:</span>
                <span className="font-mono font-bold text-blue-700 text-sm">{certData.certificate.certificateCode}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold block">Event Date:</span>
                <span className="font-bold text-slate-800">
                  {new Date(certData.event.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold block">Issue Date:</span>
                <span className="font-bold text-slate-800">
                  {new Date(certData.certificate.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
