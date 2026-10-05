import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, Store, ShieldAlert } from 'lucide-react';

export const SandboxBanner: React.FC = () => {
  const { user, demoLogin, isLoading } = useAuth();

  return (
    <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs md:text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="font-semibold uppercase tracking-wider text-[11px] bg-amber-500/20 px-1.5 py-0.5 rounded">
            Test Environment
          </span>
          <span className="hidden sm:inline">
            Sandbox simulation active. No real credit cards, bank accounts, or actual funds are charged.
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mr-1">
            Quick Persona Switch:
          </span>
          <button
            onClick={() => demoLogin('USER')}
            disabled={isLoading || (user?.role === 'USER' && user?.email === 'user@payflow.local')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all shadow-xs ${
              user?.role === 'USER' && user?.email === 'user@payflow.local'
                ? 'bg-amber-600 text-white cursor-default'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-300 dark:border-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
            Demo User
          </button>

          <button
            onClick={() => demoLogin('MERCHANT')}
            disabled={isLoading || user?.role === 'MERCHANT'}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all shadow-xs ${
              user?.role === 'MERCHANT'
                ? 'bg-amber-600 text-white cursor-default'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-300 dark:border-slate-700'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-500" />
            Demo Merchant
          </button>

          <button
            onClick={() => demoLogin('ADMIN')}
            disabled={isLoading || user?.role === 'ADMIN'}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all shadow-xs ${
              user?.role === 'ADMIN'
                ? 'bg-amber-600 text-white cursor-default'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-300 dark:border-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            Demo Admin
          </button>
        </div>
      </div>
    </div>
  );
};
