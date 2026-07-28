'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const loadActivities = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (actionFilter) params.action = actionFilter;
      const res = await api.getActivities(params);
      if (res.success) {
        setActivities(res.data || []);
        if (res.meta) setTotalPages(res.meta.totalPages);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadActivities(); }, [page, actionFilter]);

  const actionColors: Record<string, string> = {
    BORROW_REQUEST: 'bg-blue-100 text-blue-700',
    APPROVE_REQUEST: 'bg-emerald-100 text-emerald-700',
    REJECT_REQUEST: 'bg-red-100 text-red-700',
    RETURN_BOOK: 'bg-purple-100 text-purple-700',
    RESERVE_BOOK: 'bg-amber-100 text-amber-700',
    CANCEL_RESERVATION: 'bg-orange-100 text-orange-700',
    LOGIN: 'bg-zinc-100 text-zinc-700',
    REGISTER: 'bg-sky-100 text-sky-700',
    EMAIL_SENT: 'bg-pink-100 text-pink-700',
    CREATE_USER: 'bg-teal-100 text-teal-700',
  };

  return (
    <ProtectedRoute roles={['LIBRARIAN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">Activity Log</h1>
            <p className="text-zinc-500 mt-1">Audit trail of all system activities</p>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Actions</option>
            <option value="BORROW_REQUEST">Borrow Request</option>
            <option value="APPROVE_REQUEST">Approve Request</option>
            <option value="REJECT_REQUEST">Reject Request</option>
            <option value="RETURN_BOOK">Return Book</option>
            <option value="RESERVE_BOOK">Reserve Book</option>
            <option value="CANCEL_RESERVATION">Cancel Reservation</option>
            <option value="LOGIN">Login</option>
            <option value="REGISTER">Register</option>
            <option value="EMAIL_SENT">Email Sent</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-4xl mb-4">📝</p>
            <p>No activity logs found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-zinc-500">Timestamp</th>
                      <th className="text-left px-4 py-3 font-medium text-zinc-500">User</th>
                      <th className="text-left px-4 py-3 font-medium text-zinc-500">Action</th>
                      <th className="text-left px-4 py-3 font-medium text-zinc-500">Entity</th>
                      <th className="text-left px-4 py-3 font-medium text-zinc-500">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((log: any) => (
                      <tr key={log.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-zinc-800">{log.user?.firstName} {log.user?.lastName}</span>
                          <span className="text-xs text-zinc-400 block">{log.user?.libraryId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-zinc-100 text-zinc-700'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{log.entity}</td>
                        <td className="px-4 py-3 text-zinc-400 max-w-[200px] truncate">
                          {log.details ? JSON.stringify(log.details).substring(0, 100) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-zinc-300 rounded-lg text-sm disabled:opacity-50 hover:bg-zinc-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-zinc-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-zinc-300 rounded-lg text-sm disabled:opacity-50 hover:bg-zinc-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

