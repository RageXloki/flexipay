import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { PaymentLink } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  PlusCircle,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Share2,
  QrCode,
  X
} from 'lucide-react';

export const PaymentLinksPage: React.FC = () => {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [qrModalLink, setQrModalLink] = useState<PaymentLink | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/merchants/payment-links/');
      if (res.data?.payment_links) {
        setLinks(res.data.payment_links);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/merchants/payment-links/', {
        title,
        description,
        amount: amount ? parseFloat(amount) : null,
      });

      if (res.data?.status === 'success') {
        setModalOpen(false);
        setTitle('');
        setDescription('');
        setAmount('');
        fetchLinks();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create payment link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = (link: PaymentLink) => {
    const fullUrl = `${window.location.origin}/pay/${link.link_code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(link.link_code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-24">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Merchant Payment Links
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create custom checkout URLs and payment barcodes for e-commerce, invoices, and services
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setModalOpen(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Link
        </button>
      </div>

      {/* Links List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {links.map((link) => {
          const checkoutUrl = `/pay/${link.link_code}`;
          return (
            <div
              key={link.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                    {link.link_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      link.status === 'ACTIVE'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {link.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-3">
                  {link.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {link.description || 'No description provided.'}
                </p>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Amount:</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {link.amount ? `₹${Number(link.amount).toLocaleString('en-IN')}` : 'Customer Defined'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setQrModalLink(link)}
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Show QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleCopyLink(link)}
                  className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedCode === link.link_code ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Checkout Link</span>
                    </>
                  )}
                </button>

                <Link
                  to={checkoutUrl}
                  target="_blank"
                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                  title="Open Public Checkout"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}

        {links.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No payment links created yet.
          </div>
        )}
      </div>

      {/* QR Code Preview Modal */}
      {qrModalLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Payment Link QR</h3>
              <button onClick={() => setQrModalLink(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-3xl shadow-sm border border-slate-100 max-w-[200px] mx-auto">
              <QRCodeSVG
                value={`${window.location.origin}/pay/${qrModalLink.link_code}`}
                size={160}
                className="mx-auto"
              />
            </div>

            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">{qrModalLink.title}</span>
              <span className="font-mono text-xs text-indigo-600">{qrModalLink.amount ? `₹${qrModalLink.amount}` : 'Open Amount'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Link Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create Payment Link</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product / Service Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design Consulting or Wireless Earbuds"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fixed Amount (₹) (Leave blank for open customer donation/tip)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1999.00"
                  className="w-full px-3.5 py-2.5 rounded-xl font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed invoice description or shipping details"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                {submitting ? 'Generating Link...' : 'Publish Payment Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
