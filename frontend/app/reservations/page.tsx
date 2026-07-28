'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const res = await api.getReservations();
      if (res.success) setReservations(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReservations(); }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this reservation?')) return;
    try {
      const res = await api.cancelReservation(id);
      if (res.success) {
        alert('Reservation cancelled');
        loadReservations();
      } else {
        alert(res.error || 'Failed to cancel');
      }
    } catch {
      alert('Network error');
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-800">My Reservations</h1>
          <p className="text-zinc-500 mt-1">Books you have reserved</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-4xl mb-4">🔖</p>
            <p>No active reservations</p>
            <p className="text-sm mt-1">Browse books and reserve ones that are currently borrowed</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Book</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Accession</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Queue #</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Reserved</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Expires</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res: any) => (
                    <tr key={res.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 text-zinc-800">{res.book?.title || 'N/A'}</td>
                      <td className="px-4 py-3 text-zinc-500">{res.book?.accessionNo || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          #{res.queuePosition}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{new Date(res.reservationDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-zinc-500">{new Date(res.expiryDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          res.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                          res.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-zinc-100 text-zinc-700'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {res.status === 'ACTIVE' && (
                          <button onClick={() => handleCancel(res.id)} className="text-sm text-red-600 hover:text-red-700 font-medium">
                            Cancel
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

