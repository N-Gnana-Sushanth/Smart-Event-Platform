import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Upload, Key, ShieldAlert } from 'lucide-react';

export function Html5QrScanner({ onScanSuccess, onError }) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const qrRegionId = 'html5qr-code-full-region';
  const html5QrCodeRef = useRef(null);

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // ignore common scan frame misses
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError(err.message || 'Unable to access camera. Please check camera permissions or use test input.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const scanner = new Html5Qrcode('file-scan-temp-div');
      const decoded = await scanner.scanFile(file, true);
      onScanSuccess(decoded);
    } catch (err) {
      if (onError) onError('No QR code detected in the uploaded image.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      setManualCode('');
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning]);

  return (
    <div className="space-y-6">
      {/* Strict Anti-Attendance Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider block">Pass Verification Only &bull; No Attendance Recorded</span>
          This scanner only verifies pass authenticity and registration validity. Scanning does not record attendance, timestamps, or presence.
        </div>
      </div>

      {/* Video Scanner Area */}
      <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 shadow-2xl overflow-hidden relative">
        <div id={qrRegionId} className="w-full min-h-[300px] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
          {!isScanning && (
            <div className="text-center p-8">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">Camera is inactive</p>
              <p className="text-slate-600 text-xs mt-1">Click "Start Camera Scanner" to begin scanning participant passes</p>
            </div>
          )}
        </div>

        {/* Temporary hidden div for file scanning */}
        <div id="file-scan-temp-div" className="hidden" />

        {cameraError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {cameraError}
          </div>
        )}

        {/* Camera Control Buttons */}
        <div className="mt-4 flex gap-3">
          {!isScanning ? (
            <button
              type="button"
              onClick={startScanner}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera Scanner</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopScanner}
              className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition"
            >
              <CameraOff className="w-4 h-4" />
              <span>Stop Scanner</span>
            </button>
          )}
        </div>
      </div>

      {/* Alternative Input Options: File Upload & Manual Token Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload QR Image */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Scan Pass Image</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Upload a screenshot or photo of a participant's QR pass.</p>
          <label className="block w-full text-center py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 text-xs font-semibold text-slate-700 cursor-pointer transition">
            <span>Select Image File</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Manual QR Token or Registration Code */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1">
            <Key className="w-4 h-4 text-indigo-600" />
            <span>Manual Token Input</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Paste a secure QR token string to verify directly.</p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="e.g. demo-revoked-token..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0 transition"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
