'use client';

import { useState } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);

  const reportTypes = [
    { id: 'books', label: 'Book Catalog', icon: '📚', desc: 'Complete list of physical books with details' },
    { id: 'transactions', label: 'Transactions', icon: '📖', desc: 'Borrowing and return history' },
    { id: 'users', label: 'Users', icon: '👥', desc: 'Registered library users' },
    { id: 'overdue', label: 'Overdue Books', icon: '⚠️', desc: 'Books past their due date' },
    { id: 'reservations', label: 'Reservations', icon: '🔖', desc: 'Active book reservations' },
  ];

  const handleDownload = async (type: string, format: 'pdf' | 'xlsx') => {
    setGenerating(`${type}-${format}`);
    try {
      // Open in new tab for download
      const url = api.getReportUrl(type, format);
      window.open(url, '_blank');
    } catch {
      alert('Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <ProtectedRoute roles={['LIBRARIAN']}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-800">Reports</h1>
          <p className="text-zinc-500 mt-1">Generate and download library reports</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <div key={report.id} className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{report.icon}</div>
              <h3 className="font-semibold text-zinc-800 mb-1">{report.label}</h3>
              <p className="text-sm text-zinc-500 mb-4">{report.desc}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(report.id, 'pdf')}
                  disabled={generating === `${report.id}-pdf`}
                  className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {generating === `${report.id}-pdf` ? '...' : 'PDF'}
                </button>
                <button
                  onClick={() => handleDownload(report.id, 'xlsx')}
                  disabled={generating === `${report.id}-xlsx`}
                  className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {generating === `${report.id}-xlsx` ? '...' : 'Excel'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}

