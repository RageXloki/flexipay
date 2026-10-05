import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

interface ProcessingModalProps {
  isOpen: boolean;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  onFinish?: () => void;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  status,
  errorMessage,
  onFinish,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Verifying account balance & limits...',
    'Checking idempotency security key...',
    'Running sandbox fraud evaluation...',
    'Authorizing with payment gateway...',
    'Executing atomic ledger transfer...',
  ];

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      return;
    }

    if (status === 'PROCESSING') {
      const interval = setInterval(() => {
        setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isOpen, status]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-8 shadow-2xl text-center">
        {status === 'PROCESSING' && (
          <div className="space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 animate-spin" />
              <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Processing Payment
            </h3>

            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium h-5 animate-pulse">
              {steps[stepIndex]}
            </p>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>256-bit TLS Encrypted Session</span>
            </div>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center mx-auto scale-110 transition-transform">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Payment Successful!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Funds have been transferred and recorded on the sandbox ledger.
            </p>

            {onFinish && (
              <button
                onClick={onFinish}
                className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20"
              >
                View Digital Receipt
              </button>
            )}
          </div>
        )}

        {status === 'FAILED' && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Payment Failed
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMessage || 'Unable to complete transaction. Please check details and retry.'}
            </p>

            {onFinish && (
              <button
                onClick={onFinish}
                className="w-full mt-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all"
              >
                Close & Return
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
