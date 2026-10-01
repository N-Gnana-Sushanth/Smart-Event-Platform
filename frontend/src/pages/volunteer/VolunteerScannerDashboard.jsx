import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { Html5QrScanner } from '../../components/qr/Html5QrScanner';
import { QrResultModal } from '../../components/qr/QrResultModal';
import { QrCode, LogOut, ShieldCheck, User } from 'lucide-react';

export function VolunteerScannerDashboard() {
  const { volunteer, logoutVolunteer, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [scanResult, setScanResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // If neither volunteer nor admin, redirect to volunteer login
  if (!volunteer && !isAuthenticated) {
    navigate('/volunteer/login');
    return null;
  }

  const handleScanSuccess = async (qrToken) => {
    if (verifying) return;
    setVerifying(true);

    try {
      const payload = {
        qrToken,
        eventId: volunteer?.eventId || null,
      };

      const res = await api.post('/qr/verify', payload);
      setScanResult(res);
      setModalOpen(true);
    } catch (err) {
      toast.error(err.message || 'QR verification communication error');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    logoutVolunteer();
    navigate('/volunteer/login');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-base">Pass Verification Terminal</h1>
            <div className="text-xs text-slate-500 font-medium">
              Event: <span className="font-bold text-slate-800">{volunteer?.eventTitle || 'All Events (Admin Scoped)'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-slate-800">{volunteer?.name || user?.name}</div>
            <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Authorized Staff</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-rose-200 transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HTML5 QR Scanner Component */}
      <Html5QrScanner
        onScanSuccess={handleScanSuccess}
        onError={msg => toast.warning(msg)}
      />

      {/* Result Modal */}
      <QrResultModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        result={scanResult}
      />
    </div>
  );
}
