import React, { useEffect, useRef } from 'react';
import { Transaction } from '../../types';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, Printer, X, ShieldCheck, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && transaction && transaction.status === 'SUCCESSFUL') {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4F46E5', '#10B981', '#F59E0B'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate text/json receipt payload
    const receiptData = `
========================================
           FLEXIPAY DIGITAL RECEIPT
========================================
Transaction ID: ${transaction.transaction_id}
Status:         ${transaction.status}
Amount:         INR ${transaction.amount}
Date:           ${new Date(transaction.created_at).toLocaleString()}

Sender:         ${transaction.sender_name || 'External / Card'}
Receiver:       ${transaction.receiver_name || 'FlexiPay Settlement'}
Payment Method: ${transaction.payment_method}
Reference ID:   ${transaction.reference_id || 'N/A'}
Description:    ${transaction.description}
========================================
Security: 256-bit Tokenized Sandbox Transfer
    `.trim();

    const blob = new Blob([receiptData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${transaction.transaction_id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden print:border-none print:shadow-none">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 print:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Payment Receipt
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptRef} className="p-6 sm:p-8 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-400 text-white flex items-center justify-center mx-auto shadow-md font-extrabold text-xl" aria-hidden="true">
              F
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">FlexiPay</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Digital Payment Confirmation</p>
            </div>
          </div>

          {/* Amount Display */}
          <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Amount Paid</span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
              ₹{Number(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {transaction.status}
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Transaction ID</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{transaction.transaction_id}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Date & Time</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {new Date(transaction.created_at).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Paid To</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {transaction.receiver_name || transaction.receiver_email || 'Merchant Checkout'}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Paid From</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                {transaction.sender_name || 'Saved Card (Tokenized)'}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Payment Method</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {transaction.payment_method}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Gateway Reference</span>
              <span className="font-mono text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                {transaction.reference_id || 'MOCK_REF_881'}
              </span>
            </div>
          </div>

          {/* QR Verification snippet */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                Digital Verification
              </span>
              <span className="text-[10px] text-slate-400 block max-w-[200px]">
                Scan this code to verify authenticity in the sandbox ledger.
              </span>
            </div>
            <div className="p-1.5 bg-white rounded-lg shadow-xs">
              <QRCodeSVG value={`flexipay://verify?tx=${transaction.transaction_id}`} size={48} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
