import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { CertificatePreview } from './CertificatePreview';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  Award,
  Download,
  Mail,
  RefreshCw,
  FileText,
  Users,
  Eye,
  Send,
} from 'lucide-react';

export function CertificateStudio({ event, registrations = [], teams = [] }) {
  const toast = useToast();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // AI Suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [seed, setSeed] = useState(1);

  // Eligibility configuration (strictly NO attendance)
  const [eligibilityMode, setEligibilityMode] = useState('ALL'); // 'ALL', 'APPROVED', 'CUSTOM'
  const [selectedRegIds, setSelectedRegIds] = useState([]);

  // Winner assignments
  // [{ registrationId, teamId, position }]
  const [winnerAssignments, setWinnerAssignments] = useState([]);

  // Live Sample Preview data
  const [previewRecipient, setPreviewRecipient] = useState('Dr. Elena Rostova');
  const [previewType, setPreviewType] = useState('PARTICIPANT');
  const [previewAward, setPreviewAward] = useState('1st Place');

  // Load AI design suggestions
  const fetchAiSuggestions = async (seedOverride) => {
    setLoading(true);
    const activeSeed = seedOverride !== undefined ? seedOverride : seed;
    try {
      const data = await api.get(`/certificates/events/${event.id}/ai-suggestions?seed=${activeSeed}`);
      setSuggestions(data.suggestions || []);
      if (data.suggestions?.length > 0) {
        setSelectedTheme(data.suggestions[0]);
      }
    } catch (err) {
      toast.error('Failed to load AI design suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    fetchAiSuggestions(nextSeed);
  };

  const updateSelectedThemeColor = (key, value) => {
    setSelectedTheme(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    if (event?.id) {
      fetchAiSuggestions();
    }
  }, [event?.id]);

  // Handle winner selection helper
  const updateIndividualWinner = (regId, position) => {
    setWinnerAssignments(prev => {
      const filtered = prev.filter(w => w.registrationId !== regId);
      if (position) {
        return [...filtered, { registrationId: regId, position }];
      }
      return filtered;
    });
  };

  const updateTeamWinner = (teamId, position) => {
    setWinnerAssignments(prev => {
      const filtered = prev.filter(w => w.teamId !== teamId);
      if (position) {
        return [...filtered, { teamId, position }];
      }
      return filtered;
    });
  };

  // Generate Certificates
  const handleBulkGenerate = async (distributeEmail = false) => {
    setLoading(true);
    try {
      const payload = {
        eligibilityMode,
        selectedRegistrationIds: selectedRegIds,
        winnerAssignments,
        templateConfig: selectedTheme || {},
        distributeEmail,
      };

      const res = await api.post(`/certificates/events/${event.id}/generate`, payload);
      toast.success(`Successfully generated ${res.count} certificates!`);
      setActiveStep(5);
    } catch (err) {
      toast.error(err.message || 'Certificate generation failed');
    } finally {
      setLoading(false);
    }
  };

  // Download Bulk ZIP
  const handleDownloadZip = async () => {
    try {
      const blob = await api.get(`/certificates/events/${event.id}/download/zip`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.slug}_certificates.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Certificate ZIP download started');
    } catch (err) {
      toast.error('Failed to download certificates ZIP');
    }
  };

  // Download Combined PDF
  const handleDownloadCombined = async () => {
    try {
      const blob = await api.get(`/certificates/events/${event.id}/download/combined-pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.slug}_combined_certificates.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Combined certificates PDF download started');
    } catch (err) {
      toast.error('Failed to download combined PDF');
    }
  };

  // Distribute Emails
  const handleDistributeEmails = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/certificates/events/${event.id}/distribute-emails`, {});
      toast.success(`Sent ${res.sent} certificate emails successfully!`);
    } catch (err) {
      toast.error('Failed to distribute certificate emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
        {[
          { num: 1, label: 'AI Design Suggestions' },
          { num: 2, label: 'Configure Eligibility' },
          { num: 3, label: 'Winner Selection' },
          { num: 4, label: 'Sample Preview & Approve' },
          { num: 5, label: 'Bulk Generate & Export' },
        ].map(step => (
          <button
            key={step.num}
            onClick={() => setActiveStep(step.num)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeStep === step.num
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : activeStep > step.num
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
              activeStep === step.num ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'
            }`}>
              {step.num}
            </span>
            <span>{step.label}</span>
          </button>
        ))}
      </div>

      {/* STEP 1: AI DESIGN SUGGESTIONS */}
      {activeStep === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>AI Certificate Design Suggestions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AI generated 5 distinct certificate designs tailored for {event.title} ({event.category}).
              </p>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerate Suggestions</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {suggestions.map(theme => {
              const isSelected = selectedTheme?.id === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {theme.category}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>

                  {/* Palette Preview */}
                  <div className="flex gap-1.5 mb-3">
                    <div className="w-6 h-6 rounded-md shadow-sm" style={{ backgroundColor: theme.primaryColor }} />
                    <div className="w-6 h-6 rounded-md shadow-sm" style={{ backgroundColor: theme.accentColor }} />
                    <div className="w-6 h-6 rounded-md shadow-sm" style={{ backgroundColor: theme.secondaryColor }} />
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{theme.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-3">
                    {theme.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Color Customizer for Selected Theme */}
          {selectedTheme && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Custom Colors for "{selectedTheme.name}"
                </h4>
                <span className="text-[11px] text-slate-400">Adjust palette colors dynamically for PDF generation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Primary Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedTheme.primaryColor || '#1e3a8a'}
                      onChange={e => updateSelectedThemeColor('primaryColor', e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={selectedTheme.primaryColor || '#1e3a8a'}
                      onChange={e => updateSelectedThemeColor('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Accent / Gold Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedTheme.accentColor || '#d97706'}
                      onChange={e => updateSelectedThemeColor('accentColor', e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={selectedTheme.accentColor || '#d97706'}
                      onChange={e => updateSelectedThemeColor('accentColor', e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Secondary / Background Tint</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedTheme.secondaryColor || '#0f172a'}
                      onChange={e => updateSelectedThemeColor('secondaryColor', e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={selectedTheme.secondaryColor || '#0f172a'}
                      onChange={e => updateSelectedThemeColor('secondaryColor', e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Next Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setActiveStep(2)}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <span>Next: Configure Eligibility</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ELIGIBILITY CONFIGURATION (NO ATTENDANCE) */}
      {activeStep === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Certificate Eligibility</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select which participants are eligible for receiving certificates. (Per platform rules, attendance is not tracked or used for eligibility).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'ALL', title: 'All Registered Participants', desc: 'Issue certificates to all active registered participants and team members.' },
              { id: 'APPROVED', title: 'Approved Participants Only', desc: 'Only issue to participants explicitly marked as "Approved" by the admin.' },
              { id: 'CUSTOM', title: 'Custom Selection', desc: 'Manually select specific individual registrations from the roster.' },
            ].map(opt => (
              <div
                key={opt.id}
                onClick={() => setEligibilityMode(opt.id)}
                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
                  eligibilityMode === opt.id
                    ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-slate-900">{opt.title}</h4>
                  {eligibilityMode === opt.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{opt.desc}</p>
              </div>
            ))}
          </div>

          {/* If Custom Selection */}
          {eligibilityMode === 'CUSTOM' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Eligible Participants</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {registrations.map(r => (
                  <label key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-sm cursor-pointer border border-transparent hover:border-slate-200">
                    <input
                      type="checkbox"
                      checked={selectedRegIds.includes(r.id)}
                      onChange={e => {
                        if (e.target.checked) setSelectedRegIds(prev => [...prev, r.id]);
                        else setSelectedRegIds(prev => prev.filter(x => x !== r.id));
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-slate-800">{r.fullName}</span>
                    <span className="text-xs text-slate-500">({r.participantIdCode})</span>
                    <span className="text-xs font-mono text-blue-600 ml-auto">{r.registrationCode}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setActiveStep(1)}
              className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
            >
              &larr; Back
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <span>Next: Select Winners</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: WINNER SELECTION */}
      {activeStep === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Winner & Achievement Awards</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign 1st, 2nd, and 3rd place winners. For team winners, an individual certificate of achievement is automatically generated for every team member.
            </p>
          </div>

          {event.isTeamEvent ? (
            /* Team Event Winners */
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Winning Teams Selection</h4>
              {['1st Place Winner', '2nd Place Winner', '3rd Place Winner'].map(pos => {
                const assigned = winnerAssignments.find(w => w.position === pos);
                return (
                  <div key={pos} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>{pos}</span>
                    </div>
                    <select
                      value={assigned?.teamId || ''}
                      onChange={e => updateTeamWinner(e.target.value, pos)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">None / Unassigned</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.teamName} ({t.teamCode})</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Individual Event Winners */
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Individual Winners Selection</h4>
              {['1st Place Winner', '2nd Place Winner', '3rd Place Winner'].map(pos => {
                const assigned = winnerAssignments.find(w => w.position === pos);
                return (
                  <div key={pos} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>{pos}</span>
                    </div>
                    <select
                      value={assigned?.registrationId || ''}
                      onChange={e => updateIndividualWinner(e.target.value, pos)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">None / Unassigned</option>
                      {registrations.map(r => (
                        <option key={r.id} value={r.id}>{r.fullName} ({r.participantIdCode})</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setActiveStep(2)}
              className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
            >
              &larr; Back
            </button>
            <button
              onClick={() => setActiveStep(4)}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <span>Next: Sample Preview & Approve</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SAMPLE PREVIEW & APPROVE */}
      {activeStep === 4 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span>Live Sample Certificate Preview</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Preview real certificate rendering before generating credentials in bulk.
              </p>
            </div>

            {/* Preview controls */}
            <div className="flex items-center gap-2">
              <select
                value={previewType}
                onChange={e => setPreviewType(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="PARTICIPANT">Participant Certificate</option>
                <option value="WINNER">Winner Certificate</option>
              </select>
            </div>
          </div>

          {/* Certificate Live Preview Box */}
          <CertificatePreview
            certificate={{
              recipientName: previewRecipient,
              certificateType: previewType,
              awardPosition: previewType === 'WINNER' ? '1st Place Winner' : null,
              certificateCode: 'CERT-2026-SAMPLE-01',
              issueDate: new Date(),
            }}
            event={event}
            templateConfig={selectedTheme || {}}
          />

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setActiveStep(3)}
              className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
            >
              &larr; Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => handleBulkGenerate(false)}
                disabled={loading}
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-md transition"
              >
                {loading ? 'Generating...' : 'Approve & Generate All'}
              </button>
              <button
                onClick={() => handleBulkGenerate(true)}
                disabled={loading}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Generate & Email All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: BULK GENERATE & EXPORT */}
      {activeStep === 5 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900">Certificates Ready for Distribution!</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Certificates have been generated with unique IDs and cryptographically verifiable public QR credentials.
            </p>
          </div>

          {/* Download and Distribution Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={handleDownloadZip}
              className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download ZIP of Individual PDFs</span>
            </button>

            <button
              onClick={handleDownloadCombined}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
            >
              <FileText className="w-4 h-4" />
              <span>Download Single Combined PDF</span>
            </button>

            <button
              onClick={handleDistributeEmails}
              disabled={loading}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <Mail className="w-4 h-4" />
              <span>Distribute / Retry Emails</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              onClick={() => setActiveStep(1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              &larr; Modify Template or Re-run Studio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
