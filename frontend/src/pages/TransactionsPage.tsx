import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import { ReceiptModal } from '../components/common/ReceiptModal';
import {
  History,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected receipt
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter, methodFilter, directionFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (methodFilter) params.append('method', methodFilter);
      if (directionFilter) params.append('direction', directionFilter);

      const res = await api.get(`/payments/transactions/?${params.toString()}`);
      if (res.data?.results) {
        setTransactions(res.data.results);
        setTotalCount(res.data.count || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setMethodFilter('');
    setDirectionFilter('');
    setPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Transaction History
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Explore sandbox transactions, audit logs, and digital receipts
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by transaction ID, name, or note..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={(e) => {
              setDirectionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
          >
            <option value="">All Flow (Sent & Received)</option>
            <option value="sent">Money Sent (-)</option>
            <option value="received">Money Received (+)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
          >
            <option value="">All Methods</option>
            <option value="WALLET">Wallet</option>
            <option value="UPI">UPI Simulator</option>
            <option value="CARD">Saved Card</option>
          </select>

          {(search || statusFilter || methodFilter || directionFilter) && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Showing {transactions.length} of {totalCount} records</span>
          <span>Click any entry to view digital receipt</span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No transactions match the selected criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((tx) => {
              const isSent = tx.sender === user?.id;
              return (
                <div
                  key={tx.id}
                  onClick={() => {
                    setSelectedTxn(tx);
                    setReceiptOpen(true);
                  }}
                  className="py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-3 px-3 rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs ${
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
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
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
                        <span>{new Date(tx.created_at).toLocaleString()}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{tx.transaction_id}</span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{tx.payment_method}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-base block ${
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

        {/* Pagination controls */}
        {totalCount > 15 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 15 >= totalCount}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        transaction={selectedTxn}
      />
    </div>
  );
};
