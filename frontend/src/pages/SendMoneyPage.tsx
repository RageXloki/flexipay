import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, generateIdempotencyKey } from '../services/api';
import { CardToken, Transaction } from '../types';
import { PinModal } from '../components/common/PinModal';
import { ProcessingModal } from '../components/common/ProcessingModal';
import { ReceiptModal } from '../components/common/ReceiptModal';
import {
  Send,
  Search,
  User,
  Wallet,
  CreditCard,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const SendMoneyPage: React.FC = () => {
  const { wallet, refreshUserData } = useAuth();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'UPI' | 'CARD'>('WALLET');
  const [cards, setCards] = useState<CardToken[]>([]);

  // Modals & Flow States
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);
  const [processStatus, setProcessStatus] = useState<'PROCESSING' | 'SUCCESS' | 'FAILED'>('PROCESSING');
  const [errorMessage, setErrorMessage] = useState('');
  const [createdTxn, setCreatedTxn] = useState<Transaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [fraudWarning, setFraudWarning] = useState('');

  useEffect(() => {
    api.get('/payments/cards/').then((res) => {
      if (res.data?.cards) setCards(res.data.cards);
    }).catch(() => {});
  }, []);

  // Search recipient when typing query
  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        api.get(`/auth/users/search/?q=${encodeURIComponent(query)}`)
          .then((res) => {
            if (res.data?.results) setSearchResults(res.data.results);
          })
          .catch(() => {});
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  const handleSelectRecipient = (recipient: any) => {
    setSelectedRecipient(recipient);
    setQuery(recipient.email || recipient.upi_id || recipient.phone_number);
    setSearchResults([]);
  };

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient && !query) {
      alert('Please specify a recipient');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (paymentMethod === 'WALLET' && wallet && parseFloat(wallet.balance) < parsedAmount) {
      alert(`Insufficient balance in wallet (Available: ₹${wallet.balance})`);
      return;
    }

    // Open simulated PIN modal for step 4 confirmation
    setPinModalOpen(true);
  };

  const handlePinSuccess = async (enteredPin: string) => {
    setPinModalOpen(false);
    setProcessingOpen(true);
    setProcessStatus('PROCESSING');
    setErrorMessage('');
    setFraudWarning('');

    const recipientIdentifier = selectedRecipient
      ? selectedRecipient.upi_id || selectedRecipient.email
      : query;

    const idempotencyKey = generateIdempotencyKey();

    try {
      const res = await api.post(
        '/payments/send/',
        {
          recipient: recipientIdentifier,
          amount: amount,
          payment_method: paymentMethod,
          note: note || 'Transfer via PayFlow',
          upi_pin: enteredPin,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );

      if (res.data?.status === 'success') {
        setCreatedTxn(res.data.transaction);
        if (res.data.fraud_warning) {
          setFraudWarning(res.data.fraud_warning);
        }
        await refreshUserData();

        setTimeout(() => {
          setProcessStatus('SUCCESS');
        }, 1200);
      } else {
        setProcessStatus('FAILED');
        setErrorMessage(res.data?.message || 'Transaction failed');
      }
    } catch (err: any) {
      setProcessStatus('FAILED');
      setErrorMessage(err.response?.data?.message || 'Transaction could not be completed.');
    }
  };

  const handleFinishProcessing = () => {
    setProcessingOpen(false);
    if (processStatus === 'SUCCESS' && createdTxn) {
      setReceiptOpen(true);
      // Reset form
      setAmount('');
      setNote('');
      setQuery('');
      setSelectedRecipient(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-24">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Send Money
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Instant P2P transfers via PayFlow Wallet, UPI Simulator, or Tokenized Cards
        </p>
      </div>

      {fraudWarning && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Fraud Detection Simulation Alert:</span>
            <span>{fraudWarning}</span>
          </div>
        </div>
      )}

      {/* Main Payment Wizard Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <form onSubmit={handleInitiatePayment} className="space-y-6">
          {/* Step 1: Recipient Search */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              1. Choose Recipient (Name, Email, Phone, or UPI ID)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedRecipient(null);
                }}
                placeholder="Search e.g. priya@payflow, +919876543219, or Elena"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            {/* Live Autocomplete Dropdown */}
            {searchResults.length > 0 && !selectedRecipient && (
              <div className="mt-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden z-20">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleSelectRecipient(res)}
                    className="w-full p-3 flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-slate-700/60 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                        {res.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">{res.full_name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{res.upi_id || res.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500">
                      {res.role}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Recipient Confirmation Badge */}
            {selectedRecipient && (
              <div className="mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Paying: {selectedRecipient.full_name}
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                      {selectedRecipient.upi_id || selectedRecipient.email}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecipient(null);
                    setQuery('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Amount & Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              2. Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 font-bold text-lg text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 rounded-2xl font-mono text-xl font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Preset Amount Chips */}
            <div className="flex gap-2 mt-2">
              {['100', '500', '1000', '2500', '5000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
                >
                  ₹{preset}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a payment note (e.g. Dinner, Project Work)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Step 3: Payment Method Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              3. Select Payment Source
            </label>
            <div className="space-y-2.5">
              {/* Wallet Option */}
              <label
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'WALLET'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === 'WALLET'}
                    onChange={() => setPaymentMethod('WALLET')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-500" />
                      PayFlow Wallet
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Balance: ₹{wallet?.balance || '0.00'}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-600">INSTANT</span>
              </label>

              {/* UPI Option */}
              <label
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-indigo-500" />
                      UPI Simulation Switch
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Linked Bank Account Sandbox
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  SANDBOX
                </span>
              </label>

              {/* Saved Card Option */}
              <label
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-500" />
                      Tokenized Card
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {cards.length > 0 ? `•••• ${cards[0].last_four_digits}` : 'Test Card 4242'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600">ZERO CVV STORED</span>
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Security Authorization</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Security note */}
      <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Idempotency-Key Protected • No duplicate payments allowed</span>
      </div>

      {/* Modals */}
      <PinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        amount={amount}
        recipientName={selectedRecipient?.full_name || query || 'Recipient'}
      />

      <ProcessingModal
        isOpen={processingOpen}
        status={processStatus}
        errorMessage={errorMessage}
        onFinish={handleFinishProcessing}
      />

      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        transaction={createdTxn}
      />
    </div>
  );
};
