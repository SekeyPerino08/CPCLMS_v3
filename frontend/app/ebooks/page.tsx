'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getAllBookmarks, getProgress, timeAgo } from '@/lib/bookmarks';

export default function EBooksPage() {
  const router = useRouter();
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const bookmarks = getAllBookmarks();

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

  useEffect(() => {
    loadEBooks();
  }, []);

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">E-Books</h1>
            <p className="text-zinc-500 mt-1">Digital books available for reading</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
