import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DynamicCustomFieldRenderer } from '../../components/forms/DynamicCustomFieldRenderer';
import { Users, User, ArrowLeft, HeartHandshake, CheckCircle2 } from 'lucide-react';

export function RegistrationPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [regMode, setRegMode] = useState('solo');

  // Solo fields
  const [soloData, setSoloData] = useState({
    fullName: '',
    participantIdCode: '',
    email: '',
    organization: '',
    phone: '',
    customFieldValues: {},
  });

  // Team fields
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState([
    { fullName: '', participantIdCode: '', email: '', organization: '', phone: '', customFieldValues: {} },
  ]);

  // Consents & Volunteer Opt-in
  const [termsConsent, setTermsConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [volunteerOptIn, setVolunteerOptIn] = useState(false);

  useEffect(() => {
    api.get(`/events/slug/${slug}`)
      .then(data => {
        setEvent(data.event);
        if (data.event.isTeamEvent) {
          setRegMode('team');
        }
      })
      .catch(err => {
        console.error('Failed to load event:', err);
        toast.error('Event not found');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="max-w-xl mx-auto py-24 text-center text-sm text-slate-500">Loading registration form...</div>;
  }

  if (!event || event.status !== 'REGISTRATION_OPEN') {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-3">
        <h3 className="text-xl font-bold text-slate-900">Registration Unavailable</h3>
        <p className="text-xs text-slate-500">This event is not currently open for registrations.</p>
        <Link to={`/events/${slug}`} className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
          Return to Event
        </Link>
      </div>
    );
  }

  const handleAddTeamMember = () => {
    if (teamMembers.length >= event.maxTeamMembers) {
      toast.warning(`Maximum ${event.maxTeamMembers} members allowed for this team`);
      return;
    }
    setTeamMembers(prev => [
      ...prev,
      { fullName: '', participantIdCode: '', email: '', organization: '', phone: '', customFieldValues: {} },
    ]);
  };

  const handleRemoveTeamMember = (index) => {
    if (teamMembers.length <= 1) return;
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleMemberFieldChange = (index, field, value) => {
    setTeamMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsConsent || !privacyConsent) {
      toast.error('Please accept the Terms & Conditions and Privacy Policy');
      return;
    }

    setSubmitting(true);
    try {
      if (regMode === 'solo') {
        const payload = {
          ...soloData,
          volunteerOptIn,
        };
        const res = await api.post(`/registrations/events/${event.id}/register/solo`, payload);
        toast.success('Registration completed successfully!');
        navigate(`/registration-success?code=${res.registration.registrationCode}&volunteer=${volunteerOptIn}`);
      } else {
        const payload = {
          teamName,
          captainIndex: 0,
          members: teamMembers,
          volunteerOptIn,
        };
        const res = await api.post(`/registrations/events/${event.id}/register/team`, payload);
        toast.success('Team registered successfully!');
        const firstCode = res.registrations[0]?.registrationCode;
        navigate(`/registration-success?code=${firstCode}&team=${encodeURIComponent(res.team.teamName)}&volunteer=${volunteerOptIn}`);
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link to={`/events/${event.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Event Details</span>
      </Link>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-600">{event.organizationName}</div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Register for {event.title}</h1>
        <p className="text-xs text-slate-500">
          Complete the form below to receive your encrypted digital pass and registration credential.
        </p>

        {event.isTeamEvent && (
          <div className="pt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setRegMode('team')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                regMode === 'team' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team Registration (Up to {event.maxTeamMembers} members)</span>
            </button>
            <button
              type="button"
              onClick={() => setRegMode('solo')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                regMode === 'solo' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Solo Registration</span>
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {regMode === 'solo' ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Participant Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={soloData.fullName}
                  onChange={e => setSoloData({ ...soloData, fullName: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Participant ID / Roll No. *</label>
                <input
                  type="text"
                  required
                  value={soloData.participantIdCode}
                  onChange={e => setSoloData({ ...soloData, participantIdCode: e.target.value })}
                  placeholder="e.g. STU-2026-901"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={soloData.email}
                  onChange={e => setSoloData({ ...soloData, email: e.target.value })}
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Organization / Company *</label>
                <input
                  type="text"
                  required
                  value={soloData.organization}
                  onChange={e => setSoloData({ ...soloData, organization: e.target.value })}
                  placeholder="e.g. Stanford University"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={soloData.phone}
                  onChange={e => setSoloData({ ...soloData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <DynamicCustomFieldRenderer
              fields={event.customFields}
              values={soloData.customFieldValues}
              onChange={vals => setSoloData({ ...soloData, customFieldValues: vals })}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Team Name *</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="e.g. Cyber Ninjas"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Team Members ({teamMembers.length} / {event.maxTeamMembers})
                </span>
                {teamMembers.length < event.maxTeamMembers && (
                  <button
                    type="button"
                    onClick={handleAddTeamMember}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    + Add Member
                  </button>
                )}
              </div>

              {teamMembers.map((member, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {idx === 0 ? 'Team Captain (Member 1) *' : `Member ${idx + 1}`}
                    </span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(idx)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Full Name *"
                      value={member.fullName}
                      onChange={e => handleMemberFieldChange(idx, 'fullName', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Participant ID / Roll No. *"
                      value={member.participantIdCode}
                      onChange={e => handleMemberFieldChange(idx, 'participantIdCode', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email Address *"
                      value={member.email}
                      onChange={e => handleMemberFieldChange(idx, 'email', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Organization (Optional)"
                      value={member.organization}
                      onChange={e => handleMemberFieldChange(idx, 'organization', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-slate-200 space-y-3">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Want to volunteer for this event?</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Volunteers help coordinate operations and verify participant QR passes on event day.
                </p>
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="volunteerOption"
                    checked={volunteerOptIn === true}
                    onChange={() => setVolunteerOptIn(true)}
                    className="text-blue-600"
                  />
                  <span>Yes, I want to volunteer</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="volunteerOption"
                    checked={volunteerOptIn === false}
                    onChange={() => setVolunteerOptIn(false)}
                    className="text-blue-600"
                  />
                  <span>No, continue as participant only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 text-xs text-slate-600">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={termsConsent}
              onChange={e => setTermsConsent(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <span>I agree to the Event Guidelines and Code of Conduct.</span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={privacyConsent}
              onChange={e => setPrivacyConsent(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <span>I consent to credential storage and digital certificate issuance. My pass QR contains only an encrypted token.</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
        >
          {submitting ? (
            <span>Generating Pass & Confirming...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Registration & Generate Pass</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
