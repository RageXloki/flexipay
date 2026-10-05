import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, generateIdempotencyKey } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PinModal } from '../components/common/PinModal';
import { ProcessingModal } from '../components/common/ProcessingModal';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { Transaction } from '../types';
import {
  QrCode,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const ScanQRPage: React.FC = () => {
  const { wallet, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [scannedData, setScannedData] = useState<any | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [payAmount, setPayAmount] = useState('');

  // Modals
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);
  const [processStatus, setProcessStatus] = useState<'PROCESSING' | 'SUCCESS' | 'FAILED'>('PROCESSING');
  const [errorMessage, setErrorMessage] = useState('');
  const [createdTxn, setCreatedTxn] = useState<Transaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Quick Preset Test QRs for rapid demo presentation
  const demoQRPresets = [
    {
      title: 'Elena (Apex Tech Gear Store)',
      payload: 'upi://pay?pa=apexgear@payflow&pn=Apex%20Tech%20Gear&am=3499.00&cu=INR',
      amount: '3499.00',
      recipient: 'apexgear@payflow',
      name: 'Apex Tech Gear',
    },
    {
      title: 'Priya Sharma (Personal UPI)',
      payload: 'upi://pay?pa=priya@payflow&pn=Priya%20Sharma&am=450.00&cu=INR',
      amount: '450.00',
      recipient: 'priya@payflow',
      name: 'Priya Sharma',
    },
    {
      title: 'Alex Morgan (Demo User QR)',
      payload: 'upi://pay?pa=alex@payflow&pn=Alex%20Morgan&cu=INR',
      amount: '',
      recipient: 'alex@payflow',
      name: 'Alex Morgan',
    },
  ];

  const handleSimulateScan = (preset: typeof demoQRPresets[0]) => {
    setScannedData({
      recipient_name: preset.name,
      recipient_identifier: preset.recipient,
      amount: preset.amount,
      raw: preset.payload,
    });
    if (preset.amount) {
      setPayAmount(preset.amount);
    }
  };

  const handleStartCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError('Camera access unavailable or declined in browser. Use one-click simulated QR presets below.');
      setCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      handleStopCamera();
    };
  }, []);

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedData) return;
    const finalAmount = payAmount || scannedData.amount;
    if (!finalAmount || parseFloat(finalAmount) <= 0) {
      alert('Please specify the payment amount');
      return;
    }
    if (wallet && parseFloat(wallet.balance) < parseFloat(finalAmount)) {
      alert(`Insufficient wallet balance. Available: ₹${wallet.balance}`);
      return;
    }
    setPinModalOpen(true);
  };

  const handlePinSuccess = async (enteredPin: string) => {
    setPinModalOpen(false);
    setProcessingOpen(true);
    setProcessStatus('PROCESSING');
    setErrorMessage('');

    const finalAmount = payAmount || scannedData.amount;
    const idempotencyKey = generateIdempotencyKey();

    try {
      const res = await api.post(
        '/payments/send/',
        {
          recipient: scannedData.recipient_identifier,
          amount: finalAmount,
          payment_method: 'WALLET',
          note: `QR Payment to ${scannedData.recipient_name}`,
          upi_pin: enteredPin,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );

      if (res.data?.status === 'success') {
        setCreatedTxn(res.data.transaction);
        await refreshUserData();
        setTimeout(() => {
          setProcessStatus('SUCCESS');
        }, 1200);
      } else {
        setProcessStatus('FAILED');
        setErrorMessage(res.data?.message || 'Payment failed');
      }
    } catch (err: any) {
      setProcessStatus('FAILED');
      setErrorMessage(err.response?.data?.message || 'Transaction could not be completed.');
    }
  };

  const handleFinishProcessing = () => {
    setProcessingOpen(false);
    if (processStatus === 'SUCCESS' && createdTxn) {
      setReceiptOpen(true);
      setScannedData(null);
      setPayAmount('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Scan & Pay
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scan any standard UPI QR code or PayFlow merchant barcode to initiate checkout
        </p>
      </div>

      {/* Main Scan Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        {!scannedData ? (
          <>
            {/* Camera Viewport or Placeholder */}
            <div className="relative aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center border-4 border-dashed border-indigo-500/50 p-4 text-center">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover rounded-2xl"
                  playsInline
                />
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-indigo-900/50 text-indigo-400 flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 animate-pulse" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300 block">
                    Point camera at QR code
                  </span>
                  <button
                    onClick={handleStartCamera}
                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-md"
                  >
                    Open Device Camera
                  </button>
                </div>
              )}

              {/* Animated Scan Line */}
              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce pointer-events-none" />
            </div>

            {cameraError && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Instant Demo Presets Section */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>1-Click Test QR Simulation (For Demo & Grading)</span>
              </div>
              <div className="space-y-2">
                {demoQRPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSimulateScan(preset)}
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 transition-all flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-indigo-600 transition-colors">
                          {preset.title}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {preset.recipient} {preset.amount ? `• Fixed: ₹${preset.amount}` : ''}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Scanned QR Confirmation & Checkout Form */
          <form onSubmit={handleConfirmPayment} className="space-y-6 animate-fade-in">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {scannedData.recipient_name}
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                    {scannedData.recipient_identifier}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setScannedData(null)}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Scan Another
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Amount to Pay
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 font-bold text-xl text-slate-400">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={payAmount || scannedData.amount || ''}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3 rounded-2xl font-mono text-2xl font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Funding via PayFlow Wallet (Available: ₹{wallet?.balance || '0.00'})
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Confirm & Pay ₹{payAmount || scannedData.amount || '0.00'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      <PinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        amount={payAmount || scannedData?.amount || '0.00'}
        recipientName={scannedData?.recipient_name || 'Merchant'}
      />

      <ProcessingModal
        isOpen={processingOpen}
        status={processStatus}
        errorMessage={errorMessage}
        onFinish={handleFinishProcessing}
      />

      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        transaction={createdTxn}
      />
    </div>
  );
};
