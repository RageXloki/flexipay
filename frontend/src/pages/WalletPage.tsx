import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, generateIdempotencyKey } from '../services/api';
import { WalletLedgerItem } from '../types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';

export const WalletPage: React.FC = () => {
  const { wallet, refreshUserData } = useAuth();

  const [ledger, setLedger] = useState<WalletLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CARD' | 'UPI' | 'NET_BANKING'>('CARD');
  const [actionSuccess, setActionSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await api.get('/wallet/transactions/');
      if (res.data?.results) {
        setLedger(res.data.results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setActionSuccess('');
    setIsSubmitting(true);

    const idempotencyKey = generateIdempotencyKey();
    try {
      const res = await api.post(
        '/wallet/add-money/',
        {
          amount: amount,
          payment_method: method,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );

      if (res.data?.status === 'success') {
        setActionSuccess(res.data.message);
        setAmount('');
        setAddMoneyOpen(false);
        await refreshUserData();
        fetchLedger();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add money');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setActionSuccess('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/wallet/withdraw/', { amount });
      if (res.data?.status === 'success') {
        setActionSuccess(res.data.message);
        setAmount('');
        setWithdrawOpen(false);
        await refreshUserData();
        fetchLedger();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-24">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          FlexiPay Digital Wallet
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Atomic double-entry simulated ledger with instant top-up and withdrawal capability
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Balance Hero Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-2xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified Ledger Account</span>
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight mt-2">
              ₹{Number(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Currency: {wallet?.currency || 'INR'} • Status: {wallet?.status || 'ACTIVE'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAmount('');
                setError('');
                setAddMoneyOpen(true);
              }}
              className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Money
            </button>
            <button
              onClick={() => {
                setAmount('');
                setError('');
                setWithdrawOpen(true);
              }}
              className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors flex items-center gap-2 border border-white/10"
            >
              <Building className="w-4 h-4" />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Audit Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Ledger Audit Entries ({ledger.length})
            </h2>
            <p className="text-xs text-slate-400">
              Immutable credits and debits affecting your wallet balance
            </p>
          </div>
          <button
            onClick={fetchLedger}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {ledger.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No ledger transactions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {ledger.map((item) => {
              const isCredit = item.transaction_type === 'CREDIT';
              return (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs ${
                        isCredit
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {item.description}
                      </span>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px] uppercase">{item.reference_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm block ${
                        isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isCredit ? '+' : '-'}₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Bal: ₹{Number(item.balance_after).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      {addMoneyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add Money to Wallet</h3>
              <button onClick={() => setAddMoneyOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMoney} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount to Add (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000.00"
                  className="w-full px-4 py-2.5 rounded-xl font-mono text-lg font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Funding Source
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('CARD')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      method === 'CARD'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Test Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('NET_BANKING')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      method === 'NET_BANKING'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    Net Banking
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                {isSubmitting ? 'Processing Top-up...' : `Confirm Deposit of ₹${amount || '0.00'}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Money Modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Withdraw to Bank Account</h3>
              <button onClick={() => setWithdrawOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdrawMoney} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000.00"
                  className="w-full px-4 py-2.5 rounded-xl font-mono text-lg font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Available: ₹{wallet?.balance || '0.00'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 block">Settling to primary account:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">HDFC Bank (•••• 8821)</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                {isSubmitting ? 'Transferring...' : `Withdraw ₹${amount || '0.00'}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
