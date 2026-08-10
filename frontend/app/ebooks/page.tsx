'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { useDebounce } from '@/lib/useDebounce';
import Sidebar from '@/components/Sidebar';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ImageIcon,
} from 'lucide-react';

const PAGE_SIZE = 8;

const formatBadge: Record<string, string> = {
  PDF: 'bg-red-500/15 text-red-400 ring-red-500/30',
  EPUB: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  MOBI: 'bg-violet-500/15 text-violet-400 ring-violet-500/30',
};

export default function EBooksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');

  const debouncedSearch = useDebounce(search, 400);
  const debouncedCategory = useDebounce(categoryFilter, 400);

  const isLibrarian = user?.role === 'LIBRARIAN';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (debouncedCategory) params.categoryId = debouncedCategory;
      const [ebooksRes, catsRes] = await Promise.all([
        api.getEBooks(params),
        api.getCategories(),
      ]);
      if (ebooksRes.success) setEbooks(ebooksRes.data || []);
      if (catsRes.success) setCategories(catsRes.data || []);
    } catch {
      setError('Failed to load e-books');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, debouncedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, debouncedCategory, ebooks.length]);

  const totalPages = Math.max(1, Math.ceil(ebooks.length / PAGE_SIZE));
  const paginatedEBooks = ebooks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  };

  const fallbackCover = (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600/30 to-indigo-600/30">
      <FileText className="w-8 h-8 text-blue-300/70" />
    </div>
  );

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {successMsg && (
            <div className="p-4 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400">
              {successMsg}
            </div>
          )}
          {error && (
            <div className="p-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">E-Books</h1>
              <p className="text-sm text-zinc-400 mt-1">Browse and access digital books</p>
            </div>
            <div className="flex items-center gap-2">
              {isLibrarian && (
                <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add E-Book
                </button>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search e-books by title or author..."
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
              >
                <option value="" className="bg-zinc-900 text-white">All</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id} className="bg-zinc-900 text-white">{cat.name}</option>
                ))}
              </select>
              <div className="flex gap-1 p-1 bg-zinc-950 border border-zinc-700 rounded-xl">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
                <span className="self-center text-xs text-zinc-500 px-2 hidden sm:block">
                  {ebooks.length} e-books
                </span>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-zinc-900 animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && ebooks.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-300 font-medium">No e-books found</p>
              <p className="text-sm text-zinc-500 mt-1">
                {search || categoryFilter ? 'Try adjusting your search or filters' : 'Add an e-book to get started'}
              </p>
            </div>
          )}

          {/* GRID VIEW */}
          {!loading && view === 'grid' && ebooks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedEBooks.map((ebook: any) => (
                <div key={ebook.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden hover:border-zinc-700 transition-colors">
                  {/* Cover */}
                  <div className="aspect-[3/4] bg-zinc-800 relative">
                    {ebook.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ebook.coverImage} alt={ebook.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      fallbackCover
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${formatBadge[ebook.format] || 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30'}`}>
                        {ebook.format}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white line-clamp-2 leading-snug">{ebook.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{ebook.author}</p>
                    <div className="flex items-center gap-2 mt-3">
                      {ebook.category ? (
                        <span className="text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full">{ebook.category.name}</span>
                      ) : (
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">General</span>
                      )}
                      {ebook.fileSize && (
                        <span className="text-xs text-zinc-500">{formatFileSize(ebook.fileSize)}</span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => router.push(`/ebooks/reader/${ebook.id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
                      >
                        <BookOpen className="w-4 h-4" /> Read
                      </button>
                      <button
                        onClick={() => window.open(ebook.fileUrl, '_blank')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIST VIEW */}
          {!loading && view === 'list' && ebooks.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
                      <th className="px-6 py-3 font-medium">Cover</th>
                      <th className="px-6 py-3 font-medium">Title</th>
                      <th className="px-6 py-3 font-medium hidden sm:table-cell">Author</th>
                      <th className="px-6 py-3 font-medium hidden md:table-cell">Category</th>
                      <th className="px-6 py-3 font-medium">Format</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEBooks.map((ebook: any) => (
                      <tr key={ebook.id} className="border-t border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-11 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                            {ebook.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={ebook.coverImage} alt={ebook.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-zinc-600" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-zinc-100 font-medium truncate">{ebook.title}</p>
                          <p className="text-xs text-zinc-500">{ebook.publisher || ''}</p>
                        </td>
                        <td className="px-6 py-4 text-zinc-300 hidden sm:table-cell">{ebook.author}</td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {ebook.category ? (
                            <span className="text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full">{ebook.category.name}</span>
                          ) : (
                            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">General</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${formatBadge[ebook.format] || 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30'}`}>
                            {ebook.format}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => router.push(`/ebooks/reader/${ebook.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <BookOpen className="w-3.5 h-3.5" /> Read
                            </button>
                            <button
                              onClick={() => window.open(ebook.fileUrl, '_blank')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && ebooks.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-zinc-500">
                Showing{' '}
                <span className="text-zinc-300">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, ebooks.length)}
                </span>{' '}
                of <span className="text-zinc-300">{ebooks.length}</span> e-books
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
