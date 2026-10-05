import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { ProcessingModal } from '../components/common/ProcessingModal';
import { Transaction } from '../types';
import {
  Store,
  CreditCard,
  Building,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';

export const PublicCheckoutPage: React.FC = () => {
  const { linkCode } = useParams<{ linkCode: string }>();
  const { isAuthenticated, wallet } = useAuth();

  const [linkData, setLinkData] = useState<any | null>(null);
  const [merchant, setMerchant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [method, setMethod] = useState<'CARD' | 'UPI' | 'WALLET'>('CARD');

  // Processing & Receipt Modals
  const [processingOpen, setProcessingOpen] = useState(false);
  const [processStatus, setProcessStatus] = useState<'PROCESSING' | 'SUCCESS' | 'FAILED'>('PROCESSING');
  const [processError, setProcessError] = useState('');
  const [completedTxn, setCompletedTxn] = useState<Transaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    if (linkCode) {
      api.get(`/merchants/pay-link/${linkCode}/`)
        .then((res) => {
          if (res.data?.status === 'success') {
            setLinkData(res.data.payment_link);
            setMerchant(res.data.merchant);
            if (res.data.payment_link.amount) {
              setAmount(res.data.payment_link.amount);
            }
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Payment link expired or invalid.');
        })
        .finally(() => setLoading(false));
    }
  }, [linkCode]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please specify an amount');
      return;
    }

    setProcessingOpen(true);
    setProcessStatus('PROCESSING');
    setProcessError('');

    try {
      const res = await api.post(`/merchants/pay-link/${linkCode}/process/`, {
        amount,
        payment_method: method,
        customer_name: customerName || 'Guest Customer',
        customer_email: customerEmail || 'guest@payflow.local',
      });

      if (res.data?.status === 'success') {
        setCompletedTxn(res.data.transaction);
        setTimeout(() => {
          setProcessStatus('SUCCESS');
        }, 1200);
      } else {
        setProcessStatus('FAILED');
        setProcessError(res.data?.message || 'Payment rejected by gateway');
      }
    } catch (err: any) {
      setProcessStatus('FAILED');
      setProcessError(err.response?.data?.message || 'Transaction could not be completed.');
    }
  };

  const handleFinish = () => {
    setProcessingOpen(false);
    if (processStatus === 'SUCCESS' && completedTxn) {
      setReceiptOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !linkData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Checkout</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'Invalid payment link'}</p>
          <Link to="/" className="inline-block text-xs font-semibold text-indigo-600 hover:underline">
            Go to PayFlow Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-colors">
      <div className="max-w-lg w-full space-y-6">
        {/* Merchant Trust Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md font-bold text-lg">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {merchant?.business_name || 'Verified Merchant'}
          </h1>
          <span className="text-xs text-slate-400 block font-medium">
            Category: {merchant?.business_category || 'E-Commerce'} • PayFlow Hosted Checkout
          </span>
        </div>

        {/* Invoice & Payment Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Item details */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {linkData.title}
                </h3>
                {linkData.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {linkData.description}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-400 uppercase font-semibold block">Total</span>
                <span className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
                  ₹{Number(amount || linkData.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4">
            {!linkData.amount && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Specify Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="₹ 0.00"
                  className="w-full px-4 py-2.5 rounded-xl font-mono text-lg font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt Email
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Payment Options */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Select Payment Method
              </label>
              <div className="space-y-2">
                <label
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    method === 'CARD'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="checkoutMethod"
                      checked={method === 'CARD'}
                      onChange={() => setMethod('CARD')}
                      className="text-indigo-600"
                    />
                    <CreditCard className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs">Sandbox Credit / Debit Card (4242)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">TEST</span>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    method === 'UPI'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="checkoutMethod"
                      checked={method === 'UPI'}
                      onChange={() => setMethod('UPI')}
                      className="text-indigo-600"
                    />
                    <Building className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs">UPI Simulator (Instant VPA)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">UPI</span>
                </label>

                {isAuthenticated && (
                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      method === 'WALLET'
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="checkoutMethod"
                        checked={method === 'WALLET'}
                        onChange={() => setMethod('WALLET')}
                        className="text-indigo-600"
                      />
                      <Wallet className="w-4 h-4 text-amber-500" />
                      <span className="text-xs">PayFlow Wallet (Bal: ₹{wallet?.balance || '0.00'})</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Authorize & Pay ₹{amount || '0.00'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security stamp */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>End-to-End Sandbox Settlement • No Real Money Debited</span>
          </div>
        </div>
      </div>

      <ProcessingModal
        isOpen={processingOpen}
        status={processStatus}
        errorMessage={processError}
        onFinish={handleFinish}
      />

      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        transaction={completedTxn}
      />
    </div>
  );
};
