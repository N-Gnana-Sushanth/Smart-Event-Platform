import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import {
  ShieldCheck,
  Database,
  Mail,
  CheckCircle2,
  XCircle,
  KeyRound,
  Send,
  RefreshCw,
  Lock,
  Save,
  Info,
  Server,
  AlertCircle,
  BadgeCheck,
} from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Organizer Email Configuration state
  const [emailConfigLoading, setEmailConfigLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderDisplayName, setSenderDisplayName] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [secure, setSecure] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Verification & Test Email state
  const [smtpChecking, setSmtpChecking] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  // Fetch organizer email configuration on mount
  useEffect(() => {
    fetchEmailConfig();
  }, []);

  const fetchEmailConfig = async () => {
    setEmailConfigLoading(true);
    try {
      const res = await api.get('/emails/config');
      if (res.configured && res.config) {
        setIsConfigured(true);
        setSenderEmail(res.config.senderEmail || '');
        setSenderDisplayName(res.config.senderDisplayName || '');
        setSmtpHost(res.config.smtpHost || '');
        setSmtpPort(res.config.smtpPort || 587);
        setSmtpUser(res.config.smtpUser || '');
        setSecure(Boolean(res.config.secure));
        setHasPassword(Boolean(res.config.hasPassword));
        setIsVerified(Boolean(res.config.isVerified));
      } else {
        setIsConfigured(false);
        setSenderEmail(user?.email || '');
        setSenderDisplayName(user?.organization || user?.name || '');
      }
    } catch (err) {
      console.error('Failed to load email configuration:', err);
    } finally {
      setEmailConfigLoading(false);
    }
  };

  const handleSaveEmailConfig = async (e) => {
    e.preventDefault();
    if (!senderEmail || !smtpHost || !smtpUser) {
      toast.error('Sender Email, SMTP Host, and SMTP Username are required');
      return;
    }
    if (!hasPassword && !smtpPassword) {
      toast.error('SMTP Password is required for initial configuration');
      return;
    }

    setSavingConfig(true);
    try {
      const res = await api.post('/emails/config', {
        senderEmail,
        senderDisplayName,
        smtpHost,
        smtpPort: parseInt(smtpPort, 10) || 587,
        smtpUser,
        smtpPassword: smtpPassword || undefined,
        secure,
      });

      if (res.success) {
        toast.success('Email sending configuration saved!');
        setIsConfigured(true);
        setHasPassword(true);
        setSmtpPassword('');
        if (res.config) {
          setIsVerified(Boolean(res.config.isVerified));
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save email configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleVerifySmtp = async () => {
    if (!smtpHost || !smtpUser) {
      toast.error('Please enter SMTP Host and Username before testing');
      return;
    }

    setSmtpChecking(true);
    setSmtpStatus(null);
    try {
      const res = await api.post('/emails/verify-smtp', {
        senderEmail,
        senderDisplayName,
        smtpHost,
        smtpPort: parseInt(smtpPort, 10) || 587,
        smtpUser,
        smtpPassword: smtpPassword || undefined,
        secure,
      });

      setSmtpStatus(res);
      if (res.connected || res.success) {
        setIsVerified(true);
        toast.success(res.message || 'SMTP connection verified successfully!');
      } else {
        setIsVerified(false);
        toast.error(res.message || 'SMTP verification failed');
      }
    } catch (err) {
      setSmtpStatus({ connected: false, success: false, message: err.message || 'SMTP Connection Failed' });
      setIsVerified(false);
      toast.error(err.message || 'SMTP Connection Failed');
    } finally {
      setSmtpChecking(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    const targetRecipient = testEmail || user?.email;
    if (!targetRecipient) {
      toast.error('Recipient email is required');
      return;
    }

    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const res = await api.post('/emails/send-test', { recipientEmail: targetRecipient });
      setTestEmailResult(res);
      if (res.success) {
        toast.success(`Test email dispatched to ${targetRecipient}`);
      } else {
        toast.error(res.error || 'Failed to send test email');
      }
    } catch (err) {
      setTestEmailResult({ success: false, error: err.message });
      toast.error(err.message || 'Failed to send test email');
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings & Security</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage organizer email sending identity, SMTP credentials, security, and privacy compliance.
        </p>
      </div>

      {/* Email Sending Configuration Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Email Sending & SMTP Configuration</h2>
                {isConfigured ? (
                  isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <BadgeCheck className="w-3 h-3" />
                      SMTP Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      Configured
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Not Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                These settings control the email sender used for this organizer's events.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVerifySmtp}
              disabled={smtpChecking || emailConfigLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${smtpChecking ? 'animate-spin' : ''}`} />
              <span>{smtpChecking ? 'Verifying...' : 'Verify SMTP Connection'}</span>
            </button>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-indigo-950">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Dedicated Organizer Sender Identity:</strong> When participants register for your events, receive digital passes, get 2-hour reminders, or earn certificates, all emails are dispatched directly from your configured SMTP sender. Your SMTP credentials are encrypted with AES-256 and never exposed.
          </div>
        </div>

        {/* Verification Status Alert */}
        {smtpStatus && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
              smtpStatus.connected || smtpStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {smtpStatus.connected || smtpStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{smtpStatus.message}</p>
              {smtpStatus.details && <p className="text-[11px] mt-0.5 font-mono">{smtpStatus.details}</p>}
            </div>
          </div>
        )}

        {/* Email Configuration Form */}
        <form onSubmit={handleSaveEmailConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Sender Email Address *</label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={e => setSenderEmail(e.target.value)}
                placeholder="e.g. events@myorganization.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Sender Display Name</label>
              <input
                type="text"
                value={senderDisplayName}
                onChange={e => setSenderDisplayName(e.target.value)}
                placeholder="e.g. Global Tech Events Team"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">SMTP Host / Server *</label>
              <input
                type="text"
                required
                value={smtpHost}
                onChange={e => setSmtpHost(e.target.value)}
                placeholder="e.g. smtp.gmail.com, smtp.sendgrid.net, smtp.mailtrap.io"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">SMTP Port *</label>
                <input
                  type="number"
                  required
                  value={smtpPort}
                  onChange={e => {
                    const port = parseInt(e.target.value, 10);
                    setSmtpPort(e.target.value);
                    if (port === 465) setSecure(true);
                  }}
                  placeholder="587"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2.5 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={secure}
                    onChange={e => setSecure(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Use SSL / TLS</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">SMTP Username *</label>
              <input
                type="text"
                required
                value={smtpUser}
                onChange={e => setSmtpUser(e.target.value)}
                placeholder="e.g. apikey, mailer@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                SMTP Password / App Password {hasPassword ? '(Encrypted & Protected)' : '*'}
              </label>
              <input
                type="password"
                value={smtpPassword}
                onChange={e => setSmtpPassword(e.target.value)}
                placeholder={hasPassword ? '•••••••• (Password configured — leave blank to keep)' : 'Enter SMTP password'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingConfig}
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingConfig ? 'Saving Email Settings...' : 'Save Email Configuration'}</span>
            </button>
          </div>
        </form>

        {/* Send Test Email Card */}
        <div className="pt-5 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <Send className="w-3.5 h-3.5 text-indigo-600" />
            <span>Send Test Email (Using Your Authenticated Sender)</span>
          </div>

          <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              required
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={testEmailLoading}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testEmailLoading ? 'Dispatching...' : 'Send Test Email'}</span>
            </button>
          </form>

          {testEmailResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs ${
                testEmailResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testEmailResult.success ? (
                <div>
                  <p className="font-bold">Test email dispatched successfully from your sender!</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5 font-mono">
                    Sender: {senderEmail} | Recipient: {testEmail || user?.email}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-bold">Test email dispatch failed</p>
                  <p className="text-[11px] mt-0.5">{testEmailResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security / Change Password */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3>Change Password</h3>
              <p className="text-[11px] text-slate-400 font-normal">Update your organizer account login password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{pwdLoading ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>

        {/* Active Relational Database & Multi-Tenant Isolation */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3>Multi-Tenant Security & Isolation</h3>
              <p className="text-[11px] text-slate-400 font-normal">Tenant isolation & cryptographic protection</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="font-semibold text-slate-800">Tenant Isolation Scope</div>
              <p className="text-[11px] text-slate-500">
                All event rosters, digital passes, certificates, and email configurations are strictly isolated by organizer ID.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="font-semibold text-slate-800">Encrypted Credentials</div>
              <p className="text-[11px] text-slate-500">
                Organizer SMTP secrets are encrypted using AES-256-GCM server-side and never returned in plaintext.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold text-[11px]">Strict Zero-Attendance Architecture Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

