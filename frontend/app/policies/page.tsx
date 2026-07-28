'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.getPolicies();
      if (res.success) setPolicies(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPolicies(); }, []);

  const handleSave = async (key: string) => {
    try {
      const res = await api.updatePolicy(key, editValue);
      if (res.success) {
        alert('Policy updated!');
        setEditing(null);
        loadPolicies();
      } else {
        alert(res.error || 'Failed to update');
      }
    } catch {
      alert('Network error');
    }
  };

  const getPolicyDescription = (key: string): string => {
    const descs: Record<string, string> = {
      MAX_BORROW_DAYS: 'Max days a student can borrow (days)',
      FACULTY_MAX_BORROW_DAYS: 'Max days for faculty (days)',
      MAX_BOOKS_PER_USER: 'Max active books per student',
      FACULTY_MAX_BOOKS: 'Max active books per faculty',
      FINE_PER_DAY: 'Daily overdue fine (₱)',
      MAX_RESERVATION_DAYS: 'Days a reservation is held (days)',
      RESERVATION_QUEUE_LIMIT: 'Max reservations per book',
      LIBRARY_OPEN_TIME: 'Opening time (HH:MM)',
      LIBRARY_CLOSE_TIME: 'Closing time (HH:MM)',
    };
    return descs[key] || '';
  };

  return (
    <ProtectedRoute roles={['LIBRARIAN']}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-800">Library Policies</h1>
          <p className="text-zinc-500 mt-1">Configure system-wide settings and rules</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {policies.map((policy: any) => (
                <div key={policy.id} className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-zinc-800">{policy.key}</h3>
                      <p className="text-sm text-zinc-500 mt-0.5">{policy.description}</p>
                      {editing === policy.id ? (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-3 py-1.5 border border-zinc-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button onClick={() => handleSave(policy.key)} className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
                            Save
                          </button>
                          <button onClick={() => setEditing(null)} className="px-3 py-1.5 border border-zinc-300 text-sm rounded-lg hover:bg-zinc-50">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-lg font-semibold text-emerald-600">{policy.value}</span>
                          <button
                            onClick={() => { setEditing(policy.id); setEditValue(policy.value); }}
                            className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 whitespace-nowrap">{getPolicyDescription(policy.key)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

