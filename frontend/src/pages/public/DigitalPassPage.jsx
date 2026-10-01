import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DigitalPassCard } from '../../components/pass/DigitalPassCard';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export function DigitalPassPage() {
  const { code } = useParams();
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/registrations/pass/${code}`)
      .then(data => setPassData(data))
      .catch(err => {
        console.error('Failed to load pass:', err);
        setError('Digital pass not found or invalid registration code.');
      })
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return <div className="max-w-md mx-auto py-24 text-center text-sm text-slate-500">Loading digital pass...</div>;
  }

  if (error || !passData) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Pass Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Invalid credential identifier'}</p>
        <Link to="/" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
          Return to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 print:hidden">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Home</span>
      </Link>

      <DigitalPassCard
        pass={passData.pass}
        event={passData.event}
        team={passData.team}
      />
    </div>
  );
}
