import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Transaction, CardToken, UPIAccount } from '../types';
import { ReceiptModal } from '../components/common/ReceiptModal';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  CreditCard,
  History,
  Shield,
  PlusCircle,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  SendHorizontal,
  Download,
  AlertTriangle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, profile, wallet, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CardToken[]>([]);
  const [upiAccounts, setUpiAccounts] = useState<UPIAccount[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quick Stats
  const [totalSent, setTotalSent] = useState('0.00');
  const [totalReceived, setTotalReceived] = useState('0.00');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [txRes, cardRes, upiRes] = await Promise.all([
        api.get('/payments/transactions/?page_size=8'),
        api.get('/payments/cards/'),
        api.get('/payments/upi/'),
      ]);

      if (txRes.data?.results) {
        const txList: Transaction[] = txRes.data.results;
        setTransactions(txList);

        // Calculate summary
        let sent = 0;
        let received = 0;
        txList.forEach((t) => {
          if (t.status === 'SUCCESSFUL') {
            const amt = parseFloat(t.amount);
            if (t.sender === user?.id) sent += amt;
            if (t.receiver === user?.id) received += amt;
          }
        });
        setTotalSent(sent.toFixed(2));
        setTotalReceived(received.toFixed(2));
      }

      if (cardRes.data?.cards) setCards(cardRes.data.cards);
      if (upiRes.data?.upi_accounts) setUpiAccounts(upiRes.data.upi_accounts);
    } catch (err) {
      console.error('Dashboard data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = (txn: Transaction) => {
    setSelectedTxn(txn);
    setReceiptOpen(true);
  };

  const primaryUPI = upiAccounts.find((u) => u.is_primary) || upiAccounts[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in pb-24">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Primary UPI:</span>
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
              {primaryUPI?.upi_id || `${user?.email.split('@')[0]}@payflow`}
            </span>
          </p>
        </div>

        {/* Security badge widget */}
        <Link
          to="/security"
          className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
            {profile?.security_score || 85}%
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Security Score</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              Protected & Verified
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </span>
          </div>
        </Link>
      </div>

      {/* Main KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card (Featured Hero) */}
        <div className="md:col-span-1 rounded-3xl p-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between text-indigo-200 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                PayFlow Wallet Balance
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                ACTIVE
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs text-indigo-300 uppercase tracking-widest font-semibold block">Available</span>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono mt-1">
                ₹{Number(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-indigo-800/60 flex items-center justify-between gap-3">
            <Link
              to="/wallet"
              className="flex-1 py-2 px-3 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 transition-colors text-center shadow-xs"
            >
              + Add Money
            </Link>
            <Link
              to="/wallet"
              className="flex-1 py-2 px-3 rounded-xl bg-indigo-800/80 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors text-center"
            >
              Withdraw
            </Link>
          </div>
        </div>

        {/* Money Sent & Received Metrics */}
        <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Transaction Flow</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <History className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-4 my-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Total Received</span>
                  <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    +₹{totalReceived}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Total Sent</span>
                  <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                    -₹{totalSent}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/transactions"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800"
          >
            <span>Explore Full History</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Saved Tokenized Card Spotlight */}
        <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Default Sandbox Card</span>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>

          {cards.length > 0 ? (
            <div className="p-4 rounded-2xl card-gradient-visa text-white my-2 shadow-md">
              <div className="flex justify-between items-center text-xs opacity-75">
                <span>{cards[0].card_brand}</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">TOKENIZED</span>
              </div>
              <div className="text-lg font-mono tracking-widest my-3">
                •••• •••• •••• {cards[0].last_four_digits}
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="truncate max-w-[120px] uppercase font-semibold">{cards[0].cardholder_name}</span>
                <span className="font-mono">{cards[0].expiry_month}/{cards[0].expiry_year}</span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              No saved cards yet.
            </div>
          )}

          <Link
            to="/cards"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800"
          >
            <span>Manage All Saved Cards ({cards.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <Link
            to="/send-money"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <SendHorizontal className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Send Money</span>
          </Link>

          <Link
            to="/scan"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Scan & Pay</span>
          </Link>

          <Link
            to="/request-money"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Request Money</span>
          </Link>

          <Link
            to="/wallet"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
          >
            <div className="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Add to Wallet</span>
          </Link>

          <Link
            to="/cards"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
          >
            <div className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Saved Cards</span>
          </Link>

          <Link
            to="/upi"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">UPI & QR</span>
          </Link>

          <Link
            to="/security"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-center group flex flex-col items-center justify-center gap-2"
          >
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Security</span>
          </Link>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Click any transaction to open its digital receipt</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No transactions yet. Send or add money to generate sandbox activity!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((tx) => {
              const isSent = tx.sender === user?.id;
              return (
                <div
                  key={tx.id}
                  onClick={() => handleOpenReceipt(tx)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                        tx.status === 'REFUNDED'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                          : tx.status === 'FAILED'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                          : isSent
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                      }`}
                    >
                      {isSent ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {isSent ? `To ${tx.receiver_name || tx.receiver_email || 'Merchant'}` : `From ${tx.sender_name || 'Wallet Top-up'}`}
                        </span>
                        {tx.is_flagged_fraud && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            Flagged Demo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{tx.transaction_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm block ${
                        isSent ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isSent ? '-' : '+'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        tx.status === 'SUCCESSFUL'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : tx.status === 'REFUNDED'
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        transaction={selectedTxn}
      />
    </div>
  );
};
