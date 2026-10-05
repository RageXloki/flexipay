import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Transaction } from '../types';
import {
  ShieldAlert,
  Users,
  Store,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const fetchAdminOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/admin/overview/');
      if (res.data?.status === 'success') {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate') => {
    try {
      const res = await api.patch('/notifications/admin/users/action/', {
        user_id: userId,
        action,
      });
      if (res.data?.status === 'success') {
        setActionMessage(res.data.message);
        fetchAdminOverview();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!data && !loading) {
    return (
      <div className="max-w-md mx-auto p-12 text-center text-xs text-slate-400">
        Administrator privilege required to access this dashboard.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-24">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Platform Supervisor Panel
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600">
              ROLE: ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Platform-wide transaction monitoring, fraud simulation triggers, and user suspension controls
          </p>
        </div>

        <button
          onClick={fetchAdminOverview}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Users</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
            {data?.metrics?.total_users || 0}
          </div>
          <span className="text-[11px] text-slate-500 block">Personal accounts</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Registered Merchants</span>
          <div className="text-2xl font-extrabold font-mono text-emerald-600">
            {data?.metrics?.total_merchants || 0}
          </div>
          <span className="text-[11px] text-slate-500 block">Verified business stores</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Platform Volume</span>
          <div className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
            ₹{Number(data?.metrics?.total_volume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 block">Total processed transactions</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Fraud Flags (Demo)</span>
          <div className="text-2xl font-extrabold font-mono text-amber-500">
            {data?.metrics?.fraud_flagged_count || 0}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold block">Risk rules triggered</span>
        </div>
      </div>

      {/* Flagged Transactions Review Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Flagged Suspicious Transactions (Educational Fraud Simulation)
        </h2>

        {data?.flagged_transactions?.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No transactions currently flagged by risk engine.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data?.flagged_transactions?.map((tx: Transaction) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{tx.transaction_id}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      RISK FLAGGED
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium">
                    {tx.fraud_reason || 'Anomaly detected by rule engine'}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Sender: {tx.sender_name || 'N/A'} • {new Date(tx.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block">
                    ₹{tx.amount}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">{tx.payment_method}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          User & Merchant Directory
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Joined</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.users?.map((u: any) => (
                <tr key={u.id}>
                  <td className="py-3">
                    <span className="font-bold text-slate-900 dark:text-white block">{u.full_name}</span>
                    <span className="text-[11px] text-slate-400">{u.email}</span>
                  </td>
                  <td className="py-3">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">
                    {new Date(u.date_joined).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    {u.is_active ? (
                      <button
                        onClick={() => handleUserAction(u.id, 'suspend')}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction(u.id, 'activate')}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        Re-activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
