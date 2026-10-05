import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Transaction } from '../types';
import {
  Store,
  TrendingUp,
  CreditCard,
  DollarSign,
  RotateCcw,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';

export const MerchantDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>({
    total_sales: '0.00',
    today_sales: '0.00',
    successful_transactions: 0,
    failed_transactions: 0,
    refunds_issued: '0.00',
  });
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundSuccess, setRefundSuccess] = useState('');
  const [refundError, setRefundError] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  useEffect(() => {
    fetchMerchantData();
  }, []);

  const fetchMerchantData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/merchants/dashboard/');
      if (res.data?.status === 'success') {
        setMetrics(res.data.metrics);
        setRevenueChart(res.data.revenue_chart || []);
        setRecentTxns(res.data.recent_transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRefund = (txn: Transaction) => {
    setSelectedTxn(txn);
    setRefundAmount(txn.amount);
    setRefundReason('Customer requested return in sandbox');
    setRefundError('');
    setRefundSuccess('');
    setRefundModalOpen(true);
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxn) return;
    setSubmittingRefund(true);
    setRefundError('');

    try {
      const res = await api.post('/merchants/refunds/', {
        transaction_id: selectedTxn.transaction_id,
        amount: refundAmount,
        reason: refundReason,
      });

      if (res.data?.status === 'success') {
        setRefundSuccess(res.data.message);
        setTimeout(() => {
          setRefundModalOpen(false);
          fetchMerchantData();
        }, 1500);
      }
    } catch (err: any) {
      setRefundError(err.response?.data?.message || 'Refund processing failed.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Merchant Operations Hub
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              MERCHANT MODE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time settlement statistics, customer purchases, payment links, and sandbox refund controls
          </p>
        </div>

        <Link
          to="/merchant/payment-links"
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          Create Payment Link
        </Link>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Sales Volume</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
            ₹{Number(metrics.total_sales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Lifetime settlements
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Today's Revenue</span>
          <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            ₹{Number(metrics.today_sales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 block">Settled to merchant wallet</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Successful Orders</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
            {metrics.successful_transactions}
          </div>
          <span className="text-[11px] text-emerald-600 block">100% simulated fulfillment</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Refunds Issued</span>
          <div className="text-2xl font-extrabold font-mono text-amber-500">
            ₹{Number(metrics.refunds_issued).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 block">Full & partial returns</span>
        </div>
      </div>

      {/* Revenue Trend Visualizer */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          7-Day Revenue Trend (₹)
        </h2>

        <div className="grid grid-cols-7 gap-2 pt-6 items-end h-44">
          {revenueChart.map((bar, idx) => {
            const maxVal = Math.max(...revenueChart.map((b) => b.volume), 5000);
            const heightPercent = Math.max((bar.volume / maxVal) * 100, 8);
            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{bar.volume}
                </span>
                <div
                  className="w-full max-w-[48px] rounded-xl bg-gradient-to-t from-indigo-600 to-emerald-400 group-hover:brightness-110 transition-all"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {bar.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Merchant Customer Payments */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Recent Customer Orders ({recentTxns.length})
        </h2>

        {recentTxns.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No merchant transactions yet. Create a payment link and make a test checkout to see orders appear!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTxns.map((tx) => (
              <div key={tx.id} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      From: {tx.sender_name || 'Guest Checkout'}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                      {tx.payment_method}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{tx.description}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {tx.transaction_id} • {new Date(tx.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="text-right space-y-1">
                  <span className="font-mono font-bold text-sm block text-emerald-600 dark:text-emerald-400">
                    +₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>

                  {tx.status === 'SUCCESSFUL' && (
                    <button
                      onClick={() => handleOpenRefund(tx)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Refund
                    </button>
                  )}

                  {tx.status === 'REFUNDED' && (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                      REFUNDED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sandbox Refund Modal */}
      {refundModalOpen && selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Issue Sandbox Refund</h3>
              </div>
              <button onClick={() => setRefundModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {refundSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{refundSuccess}</span>
              </div>
            )}

            {refundError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{refundError}</span>
              </div>
            )}

            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="text-slate-500 block">Original Transaction:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedTxn.transaction_id}</span>
                <span className="block text-slate-400">Total Charged: ₹{selectedTxn.amount}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Refund Amount (Full or Partial)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedTxn.amount}
                  min="1"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl font-mono text-sm font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Refund Reason
                </label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRefund}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {submittingRefund ? 'Reversing Funds...' : `Confirm Refund of ₹${refundAmount}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
