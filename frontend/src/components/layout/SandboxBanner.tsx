import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, Store, ShieldAlert } from 'lucide-react';

export const SandboxBanner: React.FC = () => {
  const { user, demoLogin, isLoading } = useAuth();

  return (
    <aside
      aria-label="Sandbox demo environment announcement"
      className="bg-amber-500/15 dark:bg-amber-500/20 border-b border-amber-500/30 text-amber-950 dark:text-amber-200 px-4 py-2 text-xs md:text-sm font-medium"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true"></span>
          <span className="font-bold uppercase tracking-wider text-[11px] bg-amber-500/30 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded">
            Test Environment
          </span>
          <span className="hidden sm:inline text-xs text-amber-900 dark:text-amber-200">
            FlexiPay simulation active. No real credit cards, bank accounts, or real funds are charged.
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-amber-900 dark:text-amber-200 font-semibold mr-1">
            Quick Persona Switch:
          </span>
          <button
            onClick={() => demoLogin('USER')}
            disabled={isLoading || (user?.role === 'USER' && (user?.email === 'user@flexipay.local' || user?.email === 'user@payflow.local'))}
            aria-label="Switch persona to Demo User Alex Morgan"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              user?.role === 'USER' && (user?.email === 'user@flexipay.local' || user?.email === 'user@payflow.local')
                ? 'bg-amber-600 text-white cursor-default'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-400 dark:border-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
            Demo User
          </button>

          <button
            onClick={() => demoLogin('MERCHANT')}
            disabled={isLoading || user?.role === 'MERCHANT'}
            aria-label="Switch persona to Demo Merchant Apex Tech Gear"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              user?.role === 'MERCHANT'
                ? 'bg-amber-600 text-white cursor-default'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-400 dark:border-slate-700'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
            Demo Merchant
          </button>

          <button
            onClick={() => demoLogin('ADMIN')}
            disabled={isLoading || user?.role === 'ADMIN'}
            aria-label="Switch persona to Demo Admin Supervisor"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              user?.role === 'ADMIN'
                ? 'bg-amber-600 text-white cursor-default'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-400 dark:border-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
            Demo Admin
          </button>
        </div>
      </div>
    </aside>
  );
};
