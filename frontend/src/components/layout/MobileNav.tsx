import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Send, QrCode, History, User } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2">
      <div className="flex items-center justify-around relative">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/send-money"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <Send className="w-5 h-5" />
          <span>Send</span>
        </NavLink>

        {/* Elevated Scan & Pay Center Button */}
        <NavLink
          to="/scan"
          className="relative -top-5 flex flex-col items-center group"
          aria-label="Scan and Pay"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center text-white">
              <QrCode className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1">Scan</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <History className="w-5 h-5" />
          <span>History</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};
