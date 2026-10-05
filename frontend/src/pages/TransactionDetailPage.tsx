import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Transaction } from '../types';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api.get(`/payments/transactions/${id}/`)
        .then((res) => {
          if (res.data?.transaction) setTransaction(res.data.transaction);
        })
        .catch((err) => {
          setError('Transaction details not found or access restricted.');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{error || 'Transaction not found'}</h2>
        <Link to="/transactions" className="inline-block text-xs font-bold text-indigo-600 hover:underline">
          ← Return to Transactions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/transactions"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Transactions
      </Link>

      {/* Render the printable digital receipt inline */}
      <ReceiptModal
        isOpen={true}
        onClose={() => window.history.back()}
        transaction={transaction}
      />
    </div>
  );
};
