import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UPIAccount, BankAccount } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Building,
  PlusCircle,
  CheckCircle2,
  Copy,
  Download,
  AlertCircle,
  Share2,
  ShieldCheck
} from 'lucide-react';

export const UPIPage: React.FC = () => {
  const { user } = useAuth();

  const [upiAccounts, setUpiAccounts] = useState<UPIAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [handleInput, setHandleInput] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('50100234567890');
  const [ifsc, setIfsc] = useState('HDFC0001234');

  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUpiData();
  }, []);

  const fetchUpiData = async () => {
    try {
      const [upiRes, bankRes] = await Promise.all([
        api.get('/payments/upi/'),
        api.get('/payments/banks/'),
      ]);
      if (upiRes.data?.upi_accounts) setUpiAccounts(upiRes.data.upi_accounts);
      if (bankRes.data?.bank_accounts) setBankAccounts(bankRes.data.bank_accounts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await api.post('/payments/upi/', { handle: handleInput });
      if (res.data?.status === 'success') {
        setMessage(res.data.message);
        setHandleInput('');
        fetchUpiData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create UPI ID');
    }
  };

  const handleLinkBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await api.post('/payments/banks/', {
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifsc,
      });
      if (res.data?.status === 'success') {
        setMessage('Bank account linked to simulated UPI handle.');
        fetchUpiData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to link bank');
    }
  };

  const primaryUPI = upiAccounts.find((u) => u.is_primary) || upiAccounts[0];

  const handleCopyUPI = () => {
    if (primaryUPI) {
      navigator.clipboard.writeText(primaryUPI.upi_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          UPI Simulation & Dynamic QR
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Virtual Payment Addresses (VPA) with interoperable BharatQR / UPI string generation
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Personal Dynamic QR Card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Personal FlexiPay QR
          </span>

          {/* QR Container */}
          <div className="p-4 bg-white rounded-3xl shadow-md border border-slate-100 max-w-[220px] mx-auto">
            <QRCodeSVG
              value={primaryUPI ? primaryUPI.qr_payload : `upi://pay?pa=demo@flexipay&pn=${user?.full_name}`}
              size={180}
              className="mx-auto"
            />
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              {user?.full_name}
            </h3>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
              <span>{primaryUPI?.upi_id || 'user@flexipay'}</span>
              <button onClick={handleCopyUPI} title="Copy UPI ID">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600" />}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Anyone can scan this sandbox QR code to transfer test money directly to your FlexiPay account.
          </p>
        </div>

        {/* Manage UPI Handles & Linked Banks */}
        <div className="space-y-6">
          {/* Create custom handle */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Create Additional UPI ID
            </h3>
            <form onSubmit={handleCreateUpi} className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                    placeholder="customhandle"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                    @flexipay
                  </span>
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all shrink-0"
                >
                  Create ID
                </button>
              </div>
            </form>

            {/* List of Active UPI IDs */}
            <div className="pt-2 divide-y divide-slate-100 dark:divide-slate-800">
              {upiAccounts.map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {u.upi_id}
                  </span>
                  {u.is_primary ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      PRIMARY
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">ACTIVE</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Linked Bank Accounts */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>Linked Bank Accounts</span>
              <span className="text-[10px] text-indigo-600 font-normal">SIMULATED</span>
            </h3>

            {bankAccounts.map((bank) => (
              <div
                key={bank.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {bank.bank_name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {bank.masked_account_number} • IFSC: {bank.ifsc_code}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                  VERIFIED
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
