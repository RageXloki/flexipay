import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CardToken } from '../types';
import {
  CreditCard,
  PlusCircle,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  X
} from 'lucide-react';

export const CardsPage: React.FC = () => {
  const [cards, setCards] = useState<CardToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('12');
  const [expiryYear, setExpiryYear] = useState('2028');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/cards/');
      if (res.data?.cards) setCards(res.data.cards);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const res = await api.post('/payments/cards/', {
        cardholder_name: cardholderName,
        card_number: cardNumber,
        expiry_month: parseInt(expiryMonth),
        expiry_year: parseInt(expiryYear),
        cvv: cvv,
        is_default: isDefault,
      });

      if (res.data?.status === 'success') {
        setMessage(res.data.message);
        setAddModalOpen(false);
        setCardholderName('');
        setCardNumber('');
        setCvv('');
        fetchCards();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to tokenize card.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to remove this saved card?')) return;
    try {
      await api.delete(`/payments/cards/${id}/`);
      fetchCards();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFillSandboxCard = (type: 'VISA' | 'MASTERCARD' | 'RUPAY') => {
    setCardholderName('Alex Morgan');
    setExpiryMonth('08');
    setExpiryYear('2028');
    setCvv('123');
    if (type === 'VISA') setCardNumber('4111 1111 1111 4242');
    else if (type === 'MASTERCARD') setCardNumber('5555 5555 5555 5555');
    else if (type === 'RUPAY') setCardNumber('6080 1234 5678 9012');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-24">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tokenized Payment Cards
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            PCI-DSS compliant sandbox storage. Sensitive CVV and raw PAN are never stored.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setMessage('');
            setAddModalOpen(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          Add Sandbox Card
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          let bgClass = 'card-gradient-visa';
          if (card.card_brand === 'MASTERCARD') bgClass = 'card-gradient-mastercard';
          else if (card.card_brand === 'RUPAY') bgClass = 'card-gradient-rupay';

          return (
            <div
              key={card.id}
              className={`p-6 rounded-3xl ${bgClass} text-white shadow-xl flex flex-col justify-between h-52 relative group transition-transform hover:scale-[1.01]`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base tracking-wider">{card.card_brand}</span>
                <div className="flex items-center gap-2">
                  {card.is_default && (
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      PRIMARY
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-1 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                    title="Remove Card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Masked PAN display */}
              <div className="font-mono text-xl sm:text-2xl tracking-widest my-auto text-white/95">
                •••• •••• •••• {card.last_four_digits}
              </div>

              <div className="flex items-end justify-between text-xs">
                <div>
                  <span className="text-[10px] text-white/60 uppercase block">Cardholder</span>
                  <span className="font-semibold tracking-wider uppercase">{card.cardholder_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/60 uppercase block">Expires</span>
                  <span className="font-mono font-semibold">
                    {String(card.expiry_month).padStart(2, '0')}/{String(card.expiry_year).slice(-2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {cards.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No saved cards found. Add a sandbox card to test tokenized checkout.
          </div>
        )}
      </div>

      {/* PCI Security Badge */}
      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            Compliant Tokenization Standard: Only the surrogate token and last 4 digits are persisted. CVV is strictly verified in memory and never logged or written to storage.
          </span>
        </div>
      </div>

      {/* Add Card Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add Sandbox Card</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1-Click Sandbox Test Card Buttons */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Quick Fill Test Cards:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleFillSandboxCard('VISA')}
                  className="py-1 px-2.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold shadow-xs hover:bg-indigo-700"
                >
                  Visa 4242
                </button>
                <button
                  type="button"
                  onClick={() => handleFillSandboxCard('MASTERCARD')}
                  className="py-1 px-2.5 rounded-lg bg-slate-700 text-white text-[11px] font-bold shadow-xs hover:bg-slate-600"
                >
                  Mastercard 5555
                </button>
                <button
                  type="button"
                  onClick={() => handleFillSandboxCard('RUPAY')}
                  className="py-1 px-2.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-xs hover:bg-emerald-700"
                >
                  RuPay 6080
                </button>
              </div>
            </div>

            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Card Number (Sandbox PAN)
                </label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 1111 1111 4242"
                  className="w-full px-3.5 py-2.5 rounded-xl font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    min="2024"
                    max="2040"
                    required
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CVV (In-Memory)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_default" className="text-xs text-slate-700 dark:text-slate-300">
                  Set as default payment card
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                {submitting ? 'Tokenizing Card...' : 'Tokenize & Save Card'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
