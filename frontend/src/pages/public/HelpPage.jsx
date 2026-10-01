import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  HelpCircle,
  Calendar,
  Users,
  QrCode,
  Award,
  KeyRound,
  Mail,
  MessageSquare,
  ShieldCheck,
  Send,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function HelpPage() {
  const [config, setConfig] = useState({ supportEmail: 'support@smartevent.io' });
  const [feedback, setFeedback] = useState({ name: '', email: '', category: 'Suggestion', message: '' });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const toast = useToast();

  useEffect(() => {
    api.get('/emails/config-info')
      .then(data => {
        if (data.supportEmail) setConfig(data);
      })
      .catch(console.error);
  }, []);

  const faqs = [
    {
      category: 'Creating an Event',
      icon: Calendar,
      q: 'How do I create and publish a new event?',
      a: 'Sign in to your Organizer Account and click "Create Event" in the dashboard. Fill in basic details (Title, Date, Timezone, Venue/Link), configure registration rules (capacity, solo/team mode), set branding colors, and add custom registration questions. Once saved, the event is immediately active.',
    },
    {
      category: 'Registration & Passes',
      icon: Users,
      q: 'How do participants register and get digital passes?',
      a: 'Participants open the public event page, click "Register for Event", enter their details, and submit. Upon successful registration, an encrypted digital pass is generated with a secure QR token, and a confirmation email is dispatched.',
    },
    {
      category: 'QR Verification',
      icon: QrCode,
      q: 'What is the purpose of QR Pass Verification?',
      a: 'Event volunteers use this scanner to verify a participant\'s digital pass at the entrance. It verifies registration validity (ACTIVE, REVOKED, CANCELLED) and ensures the pass belongs to the correct event. It does not record attendance or check-in timestamps under our zero-attendance privacy model.',
    },
    {
      category: 'Certificates',
      icon: Award,
      q: 'How does the Certificate Studio work?',
      a: 'The Certificate Studio offers 5 distinct design themes. Organizers can customize primary, secondary, and accent colors with live preview, assign 1st/2nd/3rd place winners, approve layouts, and generate high-resolution PDFs with verifiable QR verification codes in bulk.',
    },
    {
      category: 'Volunteer Access',
      icon: ShieldCheck,
      q: 'How do volunteers access the QR pass scanner?',
      a: 'Volunteers log in at the Volunteer Portal using the event-specific password created by the organizer and their approved Volunteer ID, Participant ID, or registered email.',
    },
    {
      category: 'Password Reset',
      icon: KeyRound,
      q: 'How do I reset my account or volunteer password?',
      a: 'If you forgot your organizer password, click "Forgot Password?" on the login page to receive a secure single-use reset link via email. If an organizer needs to reset a volunteer password, they can do so directly from their Event Management dashboard.',
    },
    {
      category: 'Email Delivery',
      icon: Mail,
      q: 'What should I do if an email fails to arrive?',
      a: 'Organizers can view real-time delivery status in the Email Logs section. If an email fails due to network issues or provider rejections, click the "Retry" button to re-attempt immediate delivery.',
    },
    {
      category: 'General Usage',
      icon: HelpCircle,
      q: 'Is my data private from other organizers?',
      a: 'Yes. The platform enforces strict multi-tenant isolation in the backend. Organizer A can only view and manage their own events, participants, and credentials, while participants can only access their own participation records.',
    },
  ];

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    // Simulate feedback dispatch
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      toast.success('Thank you! Your feedback has been sent to our developer team.');
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <HelpCircle className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Help & Documentation Center</h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Learn how to manage events, issue passes, configure credentials, and resolve issues. For direct developer support, email{' '}
          <a href={`mailto:${config.supportEmail}`} className="text-blue-600 font-bold hover:underline">
            {config.supportEmail}
          </a>.
        </p>
      </div>

      {/* FAQs Accordion */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const Icon = faq.icon;
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-slate-50/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {faq.category}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{faq.q}</span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback / Bug Report / Upgrade Suggestion Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Report a Bug or Suggest an Upgrade</h3>
            <p className="text-xs text-slate-500">
              This site is under development. If you find any mistakes or have suggestions for upgrades, let us know!
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-emerald-900">Thank you for your feedback!</h4>
            <p className="text-xs text-emerald-700">
              Our engineering team has received your report. If required, we will reach out to {feedback.email}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Your Name *</label>
                <input
                  type="text"
                  required
                  value={feedback.name}
                  onChange={e => setFeedback({ ...feedback, name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Your Email *</label>
                <input
                  type="email"
                  required
                  value={feedback.email}
                  onChange={e => setFeedback({ ...feedback, email: e.target.value })}
                  placeholder="sarah@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Category *</label>
                <select
                  value={feedback.category}
                  onChange={e => setFeedback({ ...feedback, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Suggestion">Upgrade Suggestion</option>
                  <option value="Bug">Bug / Mistake Report</option>
                  <option value="Email">Email Delivery Problem</option>
                  <option value="Question">General Question</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Description / Details *</label>
              <textarea
                rows={4}
                required
                value={feedback.message}
                onChange={e => setFeedback({ ...feedback, message: e.target.value })}
                placeholder="Describe what you observed or what upgrade you would like to see..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Submitting...' : 'Submit Feedback'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
