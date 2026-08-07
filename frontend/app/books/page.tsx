"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { BookBorrowModal } from "@/components/BookBorrowModal";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  ShoppingCart,
  X,
  Check,
  Send,
} from "lucide-react";

const PAGE_SIZE = 8;
const MAX_BOOKS_PER_TRANSACTION = 3;
const MAX_LIMIT_MESSAGE = "You can only borrow a maximum of 3 books per transaction.";

export default function BooksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [cart, setCart] = useState<any[]>([]);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const isLibrarian = user?.role === "LIBRARIAN";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      const [booksRes, catsRes] = await Promise.all([
        api.getBooks(params),
        api.getCategories(),
      ]);
      if (booksRes.success) setBooks(booksRes.data || []);
      if (catsRes.success) setCategories(catsRes.data || []);
    } catch {
      setError("Failed to load books");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, books.length]);

  const inCart = (id: string) => cart.some((b) => b.id === id);

  const handleAddToCart = (book: any) => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (inCart(book.id)) {
      setCart((prev) => prev.filter((b) => b.id !== book.id));
      return;
    }
    if (cart.length >= MAX_BOOKS_PER_TRANSACTION) {
      setError(MAX_LIMIT_MESSAGE);
      return;
    }
    setError("");
    setCart((prev) => [...prev, book]);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((b) => b.id !== id));
  };

  const handleBorrowNow = () => {
    if (cart.length === 0) {
      setError("Please select at least one book to borrow.");
      return;
    }
    if (cart.length > MAX_BOOKS_PER_TRANSACTION) {
      setError(MAX_LIMIT_MESSAGE);
      return;
    }
    setError("");
    setShowBorrowModal(true);
  };

  const handleBorrowSuccess = () => {
    setSuccessMsg("Borrow request submitted successfully!");
    setCart([]);
    loadData();
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleDelete = async (book: any) => {
    if (!window.confirm(`Delete "${book.title}"? This action cannot be undone.`)) return;
    try {
      const res = await api.delete(`/books/${book.id}`);
      if (res.success) {
        setSuccessMsg("Book deleted successfully");
        loadData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(res.error || "Failed to delete book");
      }
    } catch {
      setError("Failed to delete book");
    }
  };

  const totalPages = Math.max(1, Math.ceil(books.length / PAGE_SIZE));
  const paginatedBooks = books.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  };

  const fallbackCover = (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/30 to-indigo-600/30">
      <BookOpen className="w-8 h-8 text-blue-300/70" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <Sidebar />
<div className="flex-1 min-w-0">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${!isLibrarian && cart.length > 0 ? "pb-44" : ""}`}>
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
            <h1 className="text-2xl font-bold text-white">Books Collection</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage your library&apos;s book collection</p>
          </div>
<div className="flex items-center gap-2">
            {isLibrarian && (
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-colors">
              <Plus className="w-4 h-4" />
              Add Book
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
                placeholder="Search by title or author..."
                className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
            >
              <option value="" className="bg-zinc-900 text-white">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id} className="bg-zinc-900 text-white">{cat.name}</option>
              ))}
            </select>
            <div className="flex gap-1 p-1 bg-zinc-950 border border-zinc-700 rounded-xl">
              <button
                onClick={() => setView("grid")}
                className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"}`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </button>
              <span className="self-center text-xs text-zinc-500 px-2 hidden sm:block">
                {books.length} books
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
        {!loading && books.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-12 h-12 text-zinc-600 mb-4" />
            <p className="text-zinc-300 font-medium">No books found</p>
            <p className="text-sm text-zinc-500 mt-1">
              {search || categoryFilter ? "Try adjusting your search or filters" : "Add a book to get started"}
            </p>
          </div>
        )}

        {/* GRID VIEW */}
        {!loading && view === "grid" && books.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedBooks.map((book: any) => (
                <div key={book.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden hover:border-zinc-700 transition-colors">
                  {/* Cover */}
                  <div className="aspect-[3/4] bg-zinc-800 relative">
                    {book.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      fallbackCover
                    )}
                    {!isLibrarian && inCart(book.id) && (
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white line-clamp-2 leading-snug">{book.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{book.author}</p>
                    <div className="flex items-center gap-2 mt-3">
                      {book.category ? (
                        <span className="text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full">{book.category.name}</span>
                      ) : (
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">General</span>
                      )}
                      {book.publishYear && (
                        <span className="text-xs text-zinc-500">{book.publishYear}</span>
                      )}
                    </div>
                    <div className="mt-3 text-xs text-zinc-400">
                      <span className="text-emerald-400 font-medium">{book.availableCopies ?? 0}</span>
                      <span className="text-zinc-500"> / {book.copies ?? 0} available</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {isLibrarian ? (
                        <>
                          <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(book)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(book)}
                          disabled={(book.availableCopies ?? 0) <= 0}
                          className={`flex-1 px-3 py-2 text-white text-sm font-semibold rounded-lg transition-colors ${
                            inCart(book.id)
                              ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                              : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {(book.availableCopies ?? 0) <= 0
                            ? "Unavailable"
                            : inCart(book.id)
                              ? "Remove"
                              : "Add to Cart"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* LIST VIEW */}
        {!loading && view === "list" && books.length > 0 && (
          <>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-6 py-3 font-medium">Book</th>
                    <th className="px-6 py-3 font-medium hidden md:table-cell">Genre</th>
                    <th className="px-6 py-3 font-medium hidden sm:table-cell">Year</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBooks.map((book: any) => (
                    <tr key={book.id} className="border-t border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                            {book.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-zinc-600" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-zinc-100 font-medium truncate">{book.title}</p>
                            <p className="text-xs text-zinc-500">{book.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-300 hidden md:table-cell">
                        {book.category?.name || "General"}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 hidden sm:table-cell">
                        {book.publishYear || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                          (book.availableCopies ?? 0) > 0
                            ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
                            : "bg-red-500/15 text-red-400 ring-red-500/30"
                        }`}>
                          {(book.availableCopies ?? 0)}/{book.copies ?? 0} available
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isLibrarian ? (
                          <div className="inline-flex items-center gap-1">
                            <button className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors" aria-label="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(book)}
                              className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(book)}
                            disabled={(book.availableCopies ?? 0) <= 0}
                            className={`px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition-colors ${
                              inCart(book.id)
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-blue-600 hover:bg-blue-700"
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            {(book.availableCopies ?? 0) <= 0 ? "Unavailable" : inCart(book.id) ? "Remove" : "Add to Cart"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && books.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-zinc-500">
              Showing{" "}
              <span className="text-zinc-300">
                {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, books.length)}
              </span>{" "}
              of <span className="text-zinc-300">{books.length}</span> books
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
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
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

        {/* Borrow Cart Bar */}
        {!isLibrarian && cart.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl z-50">
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900/95 backdrop-blur shadow-2xl shadow-black/50 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {cart.length}/3 books selected
                  </p>
                  <p className="text-xs text-zinc-500">You can borrow up to 3 books per transaction.</p>
                </div>
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {cart.map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200"
                  >
                    <span className="max-w-[160px] truncate">{b.title}</span>
                    <button
                      onClick={() => handleRemoveFromCart(b.id)}
                      className="text-zinc-400 hover:text-red-400 transition-colors"
                      aria-label={`Remove ${b.title}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleBorrowNow}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/30"
                >
                  <Send className="w-4 h-4" />
                  Send Borrow Request
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLibrarian && cart.length > 0 && (
          <BookBorrowModal
            open={showBorrowModal}
            onOpenChange={setShowBorrowModal}
            books={cart}
            onSuccess={handleBorrowSuccess}
          />
        )}
      </div>
      </div>
    </div>
  );
}
