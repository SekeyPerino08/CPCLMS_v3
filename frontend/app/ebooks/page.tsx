'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function EBooksPage() {
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadEBooks = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const res = await api.getEBooks(params);
      if (res.success) setEbooks(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEBooks(); }, []);

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">E-Books</h1>
            <p className="text-zinc-500 mt-1">Digital books available for download</p>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadEBooks()}
            placeholder="Search e-books..."
            className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button onClick={loadEBooks} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Search
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ebooks.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-4xl mb-4">📱</p>
            <p>No e-books found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ebooks.map((ebook: any) => (
              <div key={ebook.id} className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {ebook.format}
                  </span>
                  <span className="text-xs text-zinc-400">{ebook.fileSize ? `${(ebook.fileSize / 1024 / 1024).toFixed(1)} MB` : '-'}</span>
                </div>
                <h3 className="font-semibold text-zinc-800 mb-1">{ebook.title}</h3>
                <p className="text-sm text-zinc-500 mb-2">{ebook.author}</p>
                {ebook.category && (
                  <span className="inline-block px-2 py-0.5 bg-zinc-100 rounded text-xs text-zinc-600 mb-3">{ebook.category.name}</span>
                )}
                <a
                  href={ebook.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
