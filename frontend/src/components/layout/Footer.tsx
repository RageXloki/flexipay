import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Terminal, GitBranch, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 pt-12 pb-24 lg:pb-12 text-slate-500 dark:text-slate-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm">
                P
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">PayFlow</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Next-generation payment gateway & wallet system engineered with modern security standards, simulated UPI switches, and tokenized payment architectures.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>PCI-DSS Tokenization Architecture</span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2">
              <li><Link to="/wallet" className="hover:text-indigo-600 dark:hover:text-indigo-400">Digital Wallet</Link></li>
              <li><Link to="/upi" className="hover:text-indigo-600 dark:hover:text-indigo-400">UPI Simulator</Link></li>
              <li><Link to="/cards" className="hover:text-indigo-600 dark:hover:text-indigo-400">Tokenized Cards</Link></li>
              <li><Link to="/scan" className="hover:text-indigo-600 dark:hover:text-indigo-400">Dynamic QR Scanner</Link></li>
              <li><Link to="/merchant" className="hover:text-indigo-600 dark:hover:text-indigo-400">Merchant Hub</Link></li>
            </ul>
          </div>

          {/* Security & Architecture */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-3">
              Security Architecture
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-indigo-500" /> Idempotent Transactions</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Rule-based Fraud Simulation</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-indigo-500" /> Zero Plain-Text CVV Policy</li>
              <li className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-amber-500" /> Pluggable Provider Pattern</li>
              <li><Link to="/security" className="hover:text-indigo-600 dark:hover:text-indigo-400">Security Center</Link></li>
            </ul>
          </div>

          {/* Tech Stack & Attribution */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-3">
              Technical Stack
            </h4>
            <p className="text-[11px] leading-relaxed mb-3">
              Backend: Python 3.13, Django 5.2, DRF, SimpleJWT, SQLite / PostgreSQL ready.<br/>
              Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
            </p>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 block font-semibold">
                SANDBOX / DEMO REPOSITORY
              </span>
              <span className="text-[10px] text-slate-500">
                Created for technical showcase, resume portfolio, and software engineering demonstration.
              </span>
            </div>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© 2026 PayFlow Project. Built with full architectural integrity. All simulated banking data.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-slate-400">
              Crafted with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Fintech Innovation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
