import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../../api/client';
import { DigitalPassCard } from '../../components/pass/DigitalPassCard';
import { CheckCircle2, HeartHandshake } from 'lucide-react';

export function RegistrationSuccessPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const isVolunteer = searchParams.get('volunteer') === 'true';

  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (code) {
      api.get(`/registrations/pass/${code}`)
        .then(data => setPassData(data))
        .catch(err => console.error('Failed to load pass:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [code]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Registration Confirmed!</h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Your spot has been reserved. A confirmation email with your digital pass link has been dispatched.
        </p>

        {isVolunteer && (
          <div className="mt-4 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl inline-flex items-center gap-2 text-xs font-semibold text-blue-900">
            <HeartHandshake className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Volunteer Request Received: The organizers will review your volunteer application.</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Generating your digital pass card...</div>
      ) : passData ? (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-900">Your Official Digital Event Pass</h2>
            <p className="text-xs text-slate-500">Save, screenshot, or print this pass for event day verification.</p>
          </div>

          <DigitalPassCard
            pass={passData.pass}
            event={passData.event}
            team={passData.team}
          />
        </div>
      ) : null}

      <div className="flex justify-center gap-4 pt-4">
        <Link
          to="/portal"
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
        >
          View All My Passes
        </Link>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
        >
          Explore More Events
        </Link>
      </div>
    </div>
  );
}
