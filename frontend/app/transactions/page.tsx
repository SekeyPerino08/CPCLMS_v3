'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter) params.status = filter;
      const res = await api.getTransactions(params);
      if (res.success) setTransactions(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTransactions(); }, [filter]);
  useEffect(() => { loadTransactions(); }, []);

  const handleReturn = async (id: string) => {
    if (!confirm('Return this book?')) return;
    try {
      const res = await api.returnBook(id);
      if (res.success) {
        alert('Book returned successfully!');
        loadTransactions();
      } else {
        alert(res.error || 'Failed to return');
      }
    } catch {
      alert('Network error');
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-blue-100 text-blue-700',
    RETURNED: 'bg-emerald-100 text-emerald-700',
    OVERDUE: 'bg-red-100 text-red-700',
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">Transactions</h1>
            <p className="text-zinc-500 mt-1">Your borrowing history and active loans</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="RETURNED">Returned</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-4xl mb-4">📖</p>
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Book</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Accession</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Borrowed</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Due</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-zinc-500">Fine</th>
                    <th className="text-right px-4 py-3 font-medium text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn: any) => (
                    <tr key={txn.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 text-zinc-800">{txn.book?.title || 'N/A'}</td>
                      <td className="px-4 py-3 text-zinc-500">{txn.book?.accessionNo || '-'}</td>
                      <td className="px-4 py-3 text-zinc-500">{new Date(txn.borrowDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-zinc-500">{new Date(txn.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[txn.status] || 'bg-zinc-100 text-zinc-700'}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {txn.fineAmount ? <span className="text-red-600 font-medium">₱{txn.fineAmount.toFixed(2)}</span> : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {txn.status === 'ACTIVE' && (
                          <button onClick={() => handleReturn(txn.id)} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                            Return
                          </button>
                        )}
                        {txn.status === 'OVERDUE' && !txn.finePaid && txn.fineAmount > 0 && (
                          <button
                            onClick={async () => {
                              if (confirm(`Pay fine of ₱${txn.fineAmount.toFixed(2)}?`)) {
                                const res = await api.payFine(txn.id, txn.fineAmount);
                                if (res.success) { alert('Fine paid!'); loadTransactions(); }
                                else alert(res.error || 'Failed to pay');
                              }
                            }}
                            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                          >
                            Pay Fine
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

