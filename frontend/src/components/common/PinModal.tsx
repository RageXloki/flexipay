import React, { useState } from 'react';
import { ShieldCheck, Lock, X, Delete } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  amount: string;
  recipientName: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  recipientName,
}) => {
  const [pin, setPin] = useState<string>('');

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          onSuccess(nextPin);
          setPin('');
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Enter Payment PIN
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Paying <span className="font-semibold text-slate-800 dark:text-slate-200">₹{amount}</span> to{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{recipientName}</span>
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-3 my-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-indigo-600 border-indigo-600 scale-110'
                  : 'border-slate-300 dark:border-slate-700 bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mb-5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Simulated 4-Digit Sandbox PIN (Enter any 4 numbers)</span>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-white text-lg font-bold transition-all active:scale-95 flex items-center justify-center shadow-xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-13 rounded-2xl text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-white text-lg font-bold transition-all active:scale-95 flex items-center justify-center shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-13 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-rose-500 flex items-center justify-center active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
