import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  QrCode,
  CreditCard,
  Lock,
  Layers,
  Store,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  HelpCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, demoLogin, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleDemoStart = async (role: 'USER' | 'MERCHANT' | 'ADMIN') => {
    await demoLogin(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36 border-b border-slate-200 dark:border-slate-800">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-xs animate-pulse-subtle">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Test / Sandbox Environment • Inspired by Modern Fintech</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Payments made <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">simple.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Send, receive, and manage your payments securely from one place. Built with tokenized card architectures, simulated UPI switches, and merchant payment links.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDemoStart('USER')}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  Explore Demo User
                </button>
              </>
            )}
          </div>

          {/* Quick Demo Switcher Strip */}
          <div className="mt-12 max-w-xl mx-auto p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-lg">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2.5 uppercase tracking-wider">
              1-Click Role Exploration (Sandbox Accounts)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDemoStart('USER')}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all text-left"
              >
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">Alex Morgan</span>
                <span className="text-[10px] text-slate-500">Regular User</span>
              </button>
              <button
                onClick={() => handleDemoStart('MERCHANT')}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all text-left"
              >
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">Apex Tech Gear</span>
                <span className="text-[10px] text-slate-500">Merchant Store</span>
              </button>
              <button
                onClick={() => handleDemoStart('ADMIN')}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-left"
              >
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block">Supervisor</span>
                <span className="text-[10px] text-slate-500">Admin Panel</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
            Engineering Highlights
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Architecture Designed for Trust
          </h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            PayFlow demonstrates full-stack fintech principles: stateless authentication, atomic ledger balancing, PCI-compliant card tokenization, and educational fraud risk assessment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
              <QrCode className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Simulated UPI Switch</h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Create unique virtual payment addresses (e.g. <span className="font-mono text-indigo-500">alex@payflow</span>), generate dynamic QR codes, and simulate instant camera scanning payments.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Tokenized Card Vault</h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Strict zero-raw-storage security. Cards are represented via cryptographic tokens, storing only brand and masked numbers (<span className="font-mono">•••• 4242</span>). CVV is never stored.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
              <Store className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Merchant Payment Links</h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Merchants can spin up instant shareable payment links (<span className="font-mono">/pay/xyz</span>), accept payments, view sales analytics, and issue full or partial sandbox refunds.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Simulated Fraud Engine</h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Rule-based risk evaluator inspecting transaction velocity, high-value anomaly thresholds (&gt;₹50,000), and rapid consecutive failures with transparent educator warnings.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Idempotency Protection</h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every critical payment endpoint consumes an <span className="font-mono text-indigo-500">Idempotency-Key</span> header to safely prevent double-spending on duplicate clicks or unstable connections.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-6">
              <Terminal className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Pluggable Provider Pattern</h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Decoupled interface architecture allows swapping the default <span className="font-mono">MockPaymentProvider</span> with production gateways (Razorpay, Stripe) with zero business logic changes.
            </p>
          </div>
        </div>
      </section>

      {/* Security Architecture & Transparency */}
      <section id="security" className="py-20 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Security-First Mindset
              </span>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                Engineered with Zero Compromises
              </h3>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Rather than treating security as an afterthought, PayFlow implements fintech industry benchmarks from day one.
              </p>

              <div className="mt-6 space-y-3.5">
                {[
                  'Strict tokenization: Raw PAN and CVVs are discarded immediately after in-memory token generation.',
                  'No plain-text storage of PINs, passwords, or banking access codes.',
                  'Atomic database transactions ensure ledger debit and credit always succeed or fail together.',
                  'Role-Based Access Control (RBAC) separating regular users, merchants, and platform admins.',
                  'Comprehensive Security Center with calculated Security Scores and real-time login audit tracking.',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Card */}
            <div className="p-6 rounded-3xl bg-slate-900 text-slate-200 border border-slate-800 shadow-2xl font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-slate-400 text-[11px]">payment_lifecycle.py</span>
              </div>

              <pre className="text-emerald-400 overflow-x-auto text-[11px]">
{`User Request (with Idempotency-Key)
    │
    ▼
[Django REST Framework + SimpleJWT]
    │
    ├── 1. Evaluate Fraud Rules (Velocity / Limits)
    ├── 2. Verify Wallet Balance / Card Token
    │
    ▼
[Payment Provider Abstraction Layer]
    │── MockPaymentProvider (Sandbox Mode)
    │── (Extensible: Razorpay / Stripe)
    │
    ▼
[Atomic Database Ledger: DB Transaction]
    ├── Debit Sender Wallet / Card Reference
    ├── Credit Receiver Wallet
    └── Create Immutable Audit Transaction (TXN-2026-XXXX)
    │
    ▼
[Receipt Generation & Real-time Notification]`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white text-center mb-10">
          Frequently Asked Questions
        </h3>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              Does this project process real money?
            </h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No. PayFlow is an educational sandbox demonstrating payment gateway architectures, simulated UPI switches, tokenized card vaulting, and ledger transaction patterns. It never connects to real bank accounts or processes real currency.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              What test card numbers can I use?
            </h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              You can test with standard sandbox numbers: Visa (<span className="font-mono font-semibold">4111 1111 1111 4242</span>) or Mastercard (<span className="font-mono font-semibold">5555 5555 5555 5555</span>) with any future expiration date. To test card decline behavior, use card ending with <span className="font-mono font-semibold">0000</span>.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              How do I demonstrate different personas for college / portfolio reviews?
            </h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Use the top Sandbox Banner buttons: "Demo User" (Alex Morgan), "Demo Merchant" (Apex Tech Gear), and "Demo Admin" (Admin Supervisor) to instantly explore workflows without needing to register new accounts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
