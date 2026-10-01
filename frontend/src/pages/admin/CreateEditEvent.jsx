import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Settings,
  ShieldCheck,
  Palette,
  FileQuestion,
  ArrowLeft,
  PlusCircle,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export function CreateEditEvent() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Hackathons',
    type: 'HYBRID',
    eventDate: '',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    timezone: userTimezone,
    locationOrLink: '',
    organizationName: '',
    logoUrl: '',
    bannerUrl: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    regOpenDate: '',
    regCloseDate: '',
    maxRegistrations: '',
    isTeamEvent: false,
    maxTeamMembers: 4,
    requireCaptain: true,
    allowEditAfterSubmission: false,
    volunteerPassword: '',
    primaryColor: '#2563eb',
    secondaryColor: '#0f172a',
    signatureNames: ['Event Director', 'Executive Dean'],
    customFields: [],
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/events/${id}`)
        .then(data => {
          const ev = data.event;
          let sigs = ['Event Director', 'Executive Dean'];
          try {
            if (ev.signatureNamesJson) sigs = JSON.parse(ev.signatureNamesJson);
          } catch (e) {}

          setFormData({
            ...ev,
            eventDate: ev.eventDate ? ev.eventDate.split('T')[0] : '',
            regOpenDate: ev.regOpenDate ? ev.regOpenDate.split('T')[0] : '',
            regCloseDate: ev.regCloseDate ? ev.regCloseDate.split('T')[0] : '',
            signatureNames: sigs,
            customFields: ev.customFields || [],
            volunteerPassword: '',
          });
        })
        .catch(err => toast.error('Failed to load event for editing'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isPastDate = formData.eventDate && formData.eventDate < todayStr;

  const COMMON_TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];

  const addCustomField = () => {
    setFormData(prev => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { fieldName: '', label: '', fieldType: 'TEXT', isRequired: false, options: [] },
      ],
    }));
  };

  const updateCustomField = (index, key, val) => {
    setFormData(prev => {
      const updated = [...prev.customFields];
      updated[index] = { ...updated[index], [key]: val };
      return { ...prev, customFields: updated };
    });
  };

  const removeCustomField = (index) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/events/${id}`, formData);
        toast.success('Event updated successfully');
        navigate(`/admin/events/${id}`);
      } else {
        const res = await api.post('/events', formData);
        toast.success('Event created successfully');
        navigate(`/admin/events/${res.event.id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link to="/admin/events" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Events</span>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEdit ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure event lifecycle, registration rules, volunteer password, and branding.
          </p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'basic', label: 'Basic Info', icon: Calendar },
          { id: 'registration', label: 'Registration Rules', icon: Settings },
          { id: 'security', label: 'Volunteer Access', icon: ShieldCheck },
          { id: 'branding', label: 'Branding', icon: Palette },
          { id: 'fields', label: 'Custom Fields', icon: FileQuestion },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Global AI & Cloud Hackathon 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details and guidelines..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Category *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  {['Hackathons', 'Conferences', 'Seminars', 'Workshops', 'Competitions', 'Communities'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Delivery Type *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="HYBRID">Hybrid (Physical & Online)</option>
                  <option value="PHYSICAL">Physical In-Person</option>
                  <option value="ONLINE">Online Virtual</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Event Date *</label>
                <input
                  type="date"
                  required
                  value={formData.eventDate}
                  onChange={e => setFormData({ ...formData, eventDate: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
                    isPastDate
                      ? 'border-rose-500 bg-rose-50/60 text-rose-900 focus:ring-2 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                {isPastDate && (
                  <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-1">
                    <span>This event date has already passed. Please select a future date.</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Timezone</label>
                  <span className="text-[10px] text-blue-600 font-medium">Auto-detected: {userTimezone}</span>
                </div>
                <input
                  list="timezone-list"
                  type="text"
                  value={formData.timezone}
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  placeholder="e.g. UTC, America/New_York"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="timezone-list">
                  {COMMON_TIMEZONES.map(tz => (
                    <option key={tz} value={tz} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Start Time</label>
                <input
                  type="text"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">End Time</label>
                <input
                  type="text"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Venue / Access Link *</label>
                <input
                  type="text"
                  required
                  value={formData.locationOrLink}
                  onChange={e => setFormData({ ...formData, locationOrLink: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={e => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'registration' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Registration Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Closing Deadline</label>
                <input
                  type="date"
                  value={formData.regCloseDate}
                  onChange={e => setFormData({ ...formData, regCloseDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Max Registrations Cap</label>
                <input
                  type="number"
                  value={formData.maxRegistrations || ''}
                  onChange={e => setFormData({ ...formData, maxRegistrations: e.target.value })}
                  placeholder="e.g. 250"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Registration Type</label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="teamEvent"
                      checked={formData.isTeamEvent === false}
                      onChange={() => setFormData({ ...formData, isTeamEvent: false })}
                    />
                    <span>Solo Event</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="teamEvent"
                      checked={formData.isTeamEvent === true}
                      onChange={() => setFormData({ ...formData, isTeamEvent: true })}
                    />
                    <span>Team Event</span>
                  </label>
                </div>
              </div>

              {formData.isTeamEvent && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Max Team Size</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={formData.maxTeamMembers}
                    onChange={e => setFormData({ ...formData, maxTeamMembers: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Security & Staff Scanner Password</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Volunteers authenticate using this event-specific password to scan participant passes at the gate.
            </p>
            <div className="max-w-md space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Event Volunteer Access Password</label>
              <input
                type="password"
                value={formData.volunteerPassword}
                onChange={e => setFormData({ ...formData, volunteerPassword: e.target.value })}
                placeholder={isEdit ? '(Leave blank to retain current)' : 'e.g. volunteer2026'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Branding</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Banner URL</label>
                <input
                  type="url"
                  value={formData.bannerUrl || ''}
                  onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Signatory 1</label>
                <input
                  type="text"
                  value={formData.signatureNames[0] || ''}
                  onChange={e => {
                    const s = [...formData.signatureNames];
                    s[0] = e.target.value;
                    setFormData({ ...formData, signatureNames: s });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Signatory 2</label>
                <input
                  type="text"
                  value={formData.signatureNames[1] || ''}
                  onChange={e => {
                    const s = [...formData.signatureNames];
                    s[1] = e.target.value;
                    setFormData({ ...formData, signatureNames: s });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Custom Questions</h3>
              <button
                type="button"
                onClick={addCustomField}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.customFields.map((field, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Question #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomField(idx)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Question Label (e.g. Dietary Preference, GitHub) *"
                      value={field.label}
                      onChange={e => {
                        updateCustomField(idx, 'label', e.target.value);
                        updateCustomField(idx, 'fieldName', e.target.value.toLowerCase().replace(/\s+/g, '_'));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />

                    <select
                      value={field.fieldType}
                      onChange={e => updateCustomField(idx, 'fieldType', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value="TEXT">Text</option>
                      <option value="NUMBER">Number</option>
                      <option value="EMAIL">Email</option>
                      <option value="DROPDOWN">Dropdown</option>
                      <option value="RADIO">Radio Buttons</option>
                      <option value="CHECKBOX">Checkboxes</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.isRequired}
                        onChange={e => updateCustomField(idx, 'isRequired', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Required Field</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
