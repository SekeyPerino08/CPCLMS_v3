"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { BookBorrowModal } from "@/components/BookBorrowModal";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import api from "@/lib/api";

export default function BooksPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [tab, setTab] = useState<"physical" | "ebooks">("physical");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      const [booksRes, ebooksRes, catsRes] = await Promise.all([
        api.getBooks(params), api.getEBooks(params), api.getCategories(),
      ]);
      if (booksRes.success) setBooks(booksRes.data || []);
      if (ebooksRes.success) setEbooks(ebooksRes.data || []);
      if (catsRes.success) setCategories(catsRes.data || []);
    } catch {
      setError("Failed to load books");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => { const timer = setTimeout(loadData, 300); return () => clearTimeout(timer); }, [loadData]);

  const handleBorrow = (book: any) => { setSelectedBook(book); setShowBorrowModal(true); };
  const handleBorrowSuccess = () => {
    setSuccessMsg("Borrow request submitted successfully!");
    loadData();
    setTimeout(() => setSuccessMsg(""), 4000);
  };
  const displayedBooks = tab === "physical" ? books : ebooks;

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">Library Catalog</h1>
            <p className="text-sm text-zinc-500 mt-1">Browse {tab === "physical" ? "physical books" : "e-books"} - {displayedBooks.length} available</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={tab === "physical" ? "primary" : "outline"} size="sm" onClick={() => setTab("physical")}>Physical</Button>
            <Button variant={tab === "ebooks" ? "primary" : "outline"} size="sm" onClick={() => setTab("ebooks")}>E-Books</Button>
          </div>
        </div>

        {successMsg && <div className="p-4 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">Success: {successMsg}</div>}
        {error && <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1"><Input placeholder="Search by title, author..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <Select value={categoryFilter} onChange={(e: any) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </Select>
              {tab === "physical" && (
                <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="AVAILABLE">Available</option><option value="BORROWED">Borrowed</option>
                  <option value="RESERVED">Reserved</option><option value="MAINTENANCE">Maintenance</option>
                </Select>
              )}
              <div className="flex gap-1 p-1 bg-zinc-100 rounded-lg">
                <button onClick={() => setView("grid")} className={`p-2 rounded-md ${view === "grid" ? "bg-white shadow-sm" : ""}`}>Grid</button>
                <button onClick={() => setView("list")} className={`p-2 rounded-md ${view === "list" ? "bg-white shadow-sm" : ""}`}>List</button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}</div>}

        {!loading && displayedBooks.length === 0 && (
          <EmptyState
            icon={tab === "physical" ? "book" : "file"}
            title={search ? "No books match your search" : "No books available"}
            description={search ? "Try different keywords or clear filters" : "Check back later for new additions"}
            action={search ? "Clear Search" : undefined}
            onAction={() => { setSearch(""); setStatusFilter(""); setCategoryFilter(""); }}
          />
        )}

        {!loading && view === "grid" && displayedBooks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedBooks.map((book: any) => (
              <Card key={book.id} className="group hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <StatusBadge status={tab === "ebooks" ? book.format : book.status} />
                    <span className="text-xs text-zinc-400 font-mono">{tab === "ebooks" ? (book.fileSize ? (book.fileSize / 1024 / 1024).toFixed(1) + "MB" : "") : book.accessionNo}</span>
                  </div>
                  <h3 className="font-semibold text-zinc-800 mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-zinc-500 mb-2">{book.author}</p>
                  {book.category && <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{book.category.name}</span>}
                  {tab === "physical" && <div className="text-xs text-zinc-400 mt-2">{book.availableCopies}/{book.copies} available</div>}
                  <div className="flex gap-2 mt-3">
                    {tab === "physical" && book.availableCopies > 0 && user?.role !== "LIBRARIAN" && <Button size="sm" onClick={() => handleBorrow(book)} className="flex-1">Borrow</Button>}
                    {tab === "ebooks" && <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(book.fileUrl, "_blank")}>Download</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && view === "list" && displayedBooks.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 hidden sm:table-cell">Author</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedBooks.map((book: any) => (
                  <tr key={book.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3"><p className="font-medium text-zinc-800">{book.title}</p><p className="text-xs text-zinc-400">{book.category?.name}</p></td>
                    <td className="px-4 py-3 text-zinc-600 hidden sm:table-cell">{book.author}</td>
                    <td className="px-4 py-3"><StatusBadge status={tab === "ebooks" ? book.format : book.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {tab === "physical" && book.availableCopies > 0 && user?.role !== "LIBRARIAN" && <Button size="sm" onClick={() => handleBorrow(book)}>Borrow</Button>}
                      {tab === "ebooks" && <Button size="sm" variant="outline" onClick={() => window.open(book.fileUrl, "_blank")}>Download</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedBook && <BookBorrowModal open={showBorrowModal} onOpenChange={setShowBorrowModal} book={selectedBook} onSuccess={handleBorrowSuccess} />}
      </div>
    </ProtectedRoute>
  );
}
