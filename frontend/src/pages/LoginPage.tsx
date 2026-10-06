import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Phone, ArrowRight, ShieldCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, demoLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await login(identifier, password, requires2FA ? otp : undefined);
      if (res?.status === 'requires_2fa') {
        setRequires2FA(true);
        setIsSubmitting(false);
        return;
      }

      const redirectTo = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(redirectTo);
    } catch (err: any) {
      let msg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      if (
        msg.toLowerCase().includes('authentication credentials were not provided') ||
        msg.toLowerCase().includes('not authenticated')
      ) {
        msg = 'Session expired or credentials missing. Please sign in below or use 1-Click Sandbox Demo Login.';
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: 'USER' | 'MERCHANT' | 'ADMIN') => {
    setError('');
    try {
      await demoLogin(role);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Demo login failed. Ensure demo data is seeded.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-md w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              F
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
              FlexiPay
            </span>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Secure access to your simulated fintech wallet & payment gateway
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-Click Demo Fill */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Instant Sandbox Demo Login</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('USER')}
                disabled={isLoading || isSubmitting}
                className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              >
                Demo User
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('MERCHANT')}
                disabled={isLoading || isSubmitting}
                className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              >
                Merchant
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                disabled={isLoading || isSubmitting}
                className="py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              >
                Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!requires2FA ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="user@flexipay.local or +919876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-colors"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Two-Factor Authentication</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Enter the 6-digit sandbox verification code (use <span className="font-mono font-bold text-indigo-600">123456</span>).
                </p>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 rounded-xl text-center font-mono text-lg tracking-widest border border-amber-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : requires2FA ? (
                <span>Verify & Sign In</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Stateless JWT Authentication • Password Hashed with PBKDF2</span>
        </div>
      </div>
    </div>
  );
};
