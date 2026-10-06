import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PaymentRequest } from '../types';
import {
  ArrowDownLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

export const RequestMoneyPage: React.FC = () => {
  const { user, refreshUserData } = useAuth();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [incoming, setIncoming] = useState<PaymentRequest[]>([]);
  const [outgoing, setOutgoing] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/requests/');
      if (res.data?.status === 'success') {
        setIncoming(res.data.incoming || []);
        setOutgoing(res.data.outgoing || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setActionMessage('');

    try {
      const res = await api.post('/payments/requests/', {
        recipient,
        amount,
        note,
      });

      if (res.data?.status === 'success') {
        setActionMessage(res.data.message);
        setRecipient('');
        setAmount('');
        setNote('');
        fetchRequests();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send request.');
    }
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
    setError('');
    setActionMessage('');
    try {
      const res = await api.post(`/payments/requests/${requestId}/respond/`, { action });
      if (res.data?.status === 'success') {
        setActionMessage(res.data.message);
        await refreshUserData();
        fetchRequests();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to respond to request.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Request Money
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Create payment requests and respond to incoming requests from contacts
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create Request Form */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            New Payment Request
          </h2>

          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                From Contact (Email/Phone/UPI)
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. user@flexipay.local"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹ 0.00"
                className="w-full px-3.5 py-2.5 rounded-xl font-mono text-sm font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Note / Description
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Lunch split, Project share"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Send Request
            </button>
          </form>
        </div>

        {/* Requests Feed */}
        <div className="md:col-span-2 space-y-6">
          {/* Incoming Requests */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Pending Incoming Requests ({incoming.length})
              </h2>
            </div>

            {incoming.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No pending incoming requests.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {incoming.map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {req.requester_name}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Note: {req.note || 'No note'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Expires: {new Date(req.expires_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        ₹{req.amount}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRespond(req.id, 'accept')}
                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 px-2.5"
                          title="Pay Request"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Pay
                        </button>
                        <button
                          onClick={() => handleRespond(req.id, 'reject')}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs px-2.5"
                          title="Reject Request"
                        >
                          <X className="w-3.5 h-3.5" />
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests History */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Outgoing Requests ({outgoing.length})
            </h2>

            {outgoing.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                You haven't requested money from anyone yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {outgoing.map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        To: {req.payer_name}
                      </span>
                      <span className="text-[11px] text-slate-400">{req.note || 'No note'}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs block text-slate-900 dark:text-white">
                        ₹{req.amount}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'ACCEPTED'
                            ? 'text-emerald-500'
                            : req.status === 'REJECTED'
                            ? 'text-rose-500'
                            : 'text-amber-500'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
