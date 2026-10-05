import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoginActivityItem, SecurityEventItem } from '../types';
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Smartphone,
  Lock,
  Clock,
  Laptop,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const { user, profile, refreshUserData } = useAuth();

  const [securityScore, setSecurityScore] = useState(85);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginActivities, setLoginActivities] = useState<LoginActivityItem[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Change Password Modal
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/security/');
      if (res.data?.status === 'success') {
        setSecurityScore(res.data.security_score || 85);
        setTwoFactorEnabled(res.data.two_factor_enabled || false);
        setLoginActivities(res.data.login_activities || []);
        setSecurityEvents(res.data.security_events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      const res = await api.post('/auth/toggle-2fa/', { enable: !twoFactorEnabled });
      if (res.data?.status === 'success') {
        setTwoFactorEnabled(res.data.two_factor_enabled);
        setSecurityScore(res.data.security_score);
        setMessage(res.data.message);
        await refreshUserData();
        fetchSecurityData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update 2FA.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });

      if (res.data?.status === 'success') {
        setMessage(res.data.message);
        setChangePasswordOpen(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchSecurityData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Security Center & Trust Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor active device sessions, evaluate password strength, and configure Two-Factor Authentication
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Security Score Widget */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center font-extrabold shadow-inner border border-emerald-200 dark:border-emerald-800">
            <span className="text-2xl font-mono">{securityScore}</span>
            <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-300">/ 100</span>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Overall Security Posture: {securityScore >= 80 ? 'Robust' : 'Moderate'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
              Score calculated from email verification, 2FA status, password lifecycle, and device session integrity.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setError('');
            setMessage('');
            setChangePasswordOpen(true);
          }}
          className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-2xs shrink-0"
        >
          Change Password
        </button>
      </div>

      {/* Security Settings Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2FA Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Two-Factor Auth (2FA)</h3>
                <span className="text-[11px] text-slate-400">Sandbox OTP verification</span>
              </div>
            </div>

            <button
              onClick={handleToggle2FA}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                twoFactorEnabled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            When enabled, logins prompt for an additional 6-digit confirmation code. In sandbox mode, use simulated code <span className="font-mono font-bold text-indigo-600">123456</span>.
          </p>
        </div>

        {/* Tokenized Storage Policy */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Zero Raw Card Policy</h3>
              <span className="text-[11px] text-emerald-600 font-semibold">Strict PCI compliance</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Cards are tokenized upon entry. The application database stores only the masked surrogate (•••• 4242). Card CVV and banking PINs are never saved.
          </p>
        </div>
      </div>

      {/* Recent Login Activity & Audit Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logins */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Recent Login Activity
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loginActivities.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {log.device_name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    IP: {log.ip_address || '127.0.0.1'} • {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Events Audit */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            Security Audit Trail
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {securityEvents.map((evt) => (
              <div key={evt.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {evt.description}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(evt.created_at).toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded uppercase">
                  {evt.event_type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Change Account Password</h3>
              <button onClick={() => setChangePasswordOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
              >
                {submitting ? 'Updating...' : 'Save New Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
