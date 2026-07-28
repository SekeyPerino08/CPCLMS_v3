'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter) params.status = filter;
      const res = await api.getBorrowRequests(params);
      if (res.success) setRequests(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, [filter]);
  useEffect(() => { loadRequests(); }, []);

  const isLibrarian = user?.role === 'LIBRARIAN';

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this borrow request?')) return;
    try {
      const res = await api.approveRequest(id);
      if (res.success) {
        alert('Request approved!');
        loadRequests();
      } else {
        alert(res.error || 'Failed to approve');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return alert('Please provide a reason');
    try {
      const res = await api.rejectRequest(id, rejectReason);
      if (res.success) {
        alert('Request rejected');
        setRejectModal(null);
        setRejectReason('');
        loadRequests();
      } else {
        alert(res.error || 'Failed to reject');
      }
    } catch {
      alert('Network error');
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-zinc-100 text-zinc-700',
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">Borrow Requests</h1>
            <p className="text-zinc-500 mt-1">{isLibrarian ? 'Manage student/faculty requests' : 'Your borrow requests'}</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-4xl mb-4">📋</p>
            <p>No requests found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">User</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Book</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Notes</th>
                    {isLibrarian && <th className="text-right px-4 py-3 font-medium text-zinc-500">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req: any) => (
                    <tr key={req.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <span className="text-zinc-800">{req.user?.firstName} {req.user?.lastName}</span>
                        <span className="text-xs text-zinc-400 block">{req.user?.libraryId}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-800">{req.book?.title || 'N/A'}</td>
                      <td className="px-4 py-3 text-zinc-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status] || ''}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 max-w-[200px] truncate">{req.notes || '-'}</td>
                      {isLibrarian && req.status === 'PENDING' && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleApprove(req.id)} className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors">
                              Approve
                            </button>
                            <button onClick={() => setRejectModal(req.id)} className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors">
                              Reject
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-zinc-800 mb-4">Reject Request</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg mb-4 h-24 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50">
                  Cancel
                </button>
                <button onClick={() => handleReject(rejectModal)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

