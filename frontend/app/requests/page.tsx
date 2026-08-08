"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { useDebounce } from "@/lib/useDebounce";
import Sidebar from "@/components/Sidebar";
import { QRApprovalModal } from "@/components/QRApprovalModal";
import {
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  AlertTriangle,
  QrCode,
} from "lucide-react";

const PAGE_SIZE = 10;

// ── Transaction (Borrowed Books) status styling ──
const txnStatusBadge: Record<string, string> = {
  ACTIVE: "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  RETURNED: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  OVERDUE: "bg-red-500/15 text-red-400 ring-red-500/30",
};
const txnStatusLabel: Record<string, string> = {
  ACTIVE: "Borrowed",
  RETURNED: "Returned",
  OVERDUE: "Overdue",
};

// ── Request status styling ──
const reqStatusBadge: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  REJECTED: "bg-red-500/15 text-red-400 ring-red-500/30",
};
const reqStatusLabel: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function RequestsPage() {
  const { user } = useAuth();
  const isLibrarian = user?.role === "LIBRARIAN";

  // Borrowed books (transactions)
  const [txns, setTxns] = useState<any[]>([]);
  const [txnTotal, setTxnTotal] = useState(0);
  const [txnLoading, setTxnLoading] = useState(true);
  const [txnSearch, setTxnSearch] = useState("");
  const [txnStatusFilter, setTxnStatusFilter] = useState("");
  const [txnPage, setTxnPage] = useState(1);

  // Borrow requests
  const [records, setRecords] = useState<any[]>([]);
  const [reqTotal, setReqTotal] = useState(0);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqSearch, setReqSearch] = useState("");
  const [reqStatusFilter, setReqStatusFilter] = useState("");
  const [reqPage, setReqPage] = useState(1);

  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // Debounced search/filter values (300ms) to avoid per-keystroke API spam
  const debouncedTxnSearch = useDebounce(txnSearch, 300);
  const debouncedTxnStatus = useDebounce(txnStatusFilter, 300);
  const debouncedReqSearch = useDebounce(reqSearch, 300);
  const debouncedReqStatus = useDebounce(reqStatusFilter, 300);

  // Per-action in-flight guards (disable buttons while a request is running)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

// Declare Missing modal state (librarian only)
  const [missingTarget, setMissingTarget] = useState<any>(null);
  const [missingReason, setMissingReason] = useState("");
  const [missingLoading, setMissingLoading] = useState(false);
  const [missingError, setMissingError] = useState("");

  // Reject Borrow Request modal state (librarian only)
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState("");

  // QR Approval modal state (librarian only)
  const [qrApprovalTarget, setQrApprovalTarget] = useState<any>(null);

  // ── Load borrowed books (transactions) ──
  const loadTransactions = useCallback(async () => {
    setTxnLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(txnPage),
        limit: String(PAGE_SIZE),
      };
      if (debouncedTxnSearch) params.search = debouncedTxnSearch;
      if (debouncedTxnStatus) params.status = debouncedTxnStatus;

      const res = await api.get<any>(`/transactions?${new URLSearchParams(params).toString()}`);
      if (res.success) {
        setTxns((res.data as any[]) || []);
        setTxnTotal(res.meta?.total ?? ((res.data as any[]) || []).length);
      } else if (res.rateLimited) {
        setError("You're moving too fast. Please wait a moment and try again.");
      } else {
        setError(res.error || "Failed to load borrowed books");
      }
    } catch {
      setError("Failed to load borrowed books");
    } finally {
      setTxnLoading(false);
    }
  }, [debouncedTxnSearch, debouncedTxnStatus, txnPage]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    setTxnPage(1);
  }, [debouncedTxnSearch, debouncedTxnStatus]);

  // ── Load borrow requests ──
  const loadRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(reqPage),
        limit: String(PAGE_SIZE),
      };
      if (debouncedReqSearch) params.search = debouncedReqSearch;
      if (debouncedReqStatus) params.status = debouncedReqStatus;

      const res = await api.getBorrowRequests(params);
      if (res.success) {
        setRecords((res.data as any[]) || []);
        setReqTotal(res.meta?.total ?? ((res.data as any[]) || []).length);
      } else if (res.rateLimited) {
        setError("You're moving too fast. Please wait a moment and try again.");
      } else {
        setError(res.error || "Failed to load borrow requests");
      }
    } catch {
      setError("Failed to load borrow requests");
    } finally {
      setReqLoading(false);
    }
  }, [debouncedReqSearch, debouncedReqStatus, reqPage]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    setReqPage(1);
  }, [debouncedReqSearch, debouncedReqStatus]);

// ── Borrowed books actions ──
  const handleReturn = async (record: any) => {
    if (!window.confirm(`Return "${record.book?.title || 'this book'}"?`)) return;
    if (actionLoadingId) return; // prevent double-click spam
    setActionLoadingId(record.id);
    try {
      const res = await api.returnBook(record.id);
      if (res.success) {
        setSuccessMsg("Book returned successfully");
        loadTransactions();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else if (res.rateLimited) {
        setError("You're moving too fast. Please wait a moment and try again.");
      } else {
        setError(res.error || "Failed to return book");
      }
    } catch {
      setError("Failed to return book");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePayFine = async (record: any) => {
    const amount = record.fineAmount ?? 0;
    if (!window.confirm(`Pay fine of ₱${amount.toFixed(2)}?`)) return;
    if (actionLoadingId) return; // prevent double-click spam
    setActionLoadingId(record.id);
    try {
      const res = await api.payFine(record.id, amount);
      if (res.success) {
        setSuccessMsg("Fine paid successfully");
        loadTransactions();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else if (res.rateLimited) {
        setError("You're moving too fast. Please wait a moment and try again.");
      } else {
        setError(res.error || "Failed to pay fine");
      }
    } catch {
      setError("Failed to pay fine");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openMissingModal = (record: any) => {
    setMissingTarget(record);
    setMissingReason("");
    setMissingError("");
  };

  const handleDeclareMissing = async () => {
    if (!missingTarget) return;
    setMissingLoading(true);
    setMissingError("");
    try {
      const res = await api.declareMissing(missingTarget.id, missingReason || undefined);
      if (res.success) {
        setMissingTarget(null);
        setMissingReason("");
        setSuccessMsg("Book declared missing");
        loadTransactions();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setMissingError(res.error || "Failed to declare book missing");
      }
    } catch {
      setMissingError("Failed to declare book missing");
    } finally {
      setMissingLoading(false);
    }
  };

// ── Borrow requests actions ──
  // The Approve action now opens a QR approval modal instead of approving
  // directly. The request only becomes APPROVED once the borrower scans the
  // QR (deep link) on their phone.
  const handleApprove = (request: any) => {
    setQrApprovalTarget(request);
  };

  const handleQRApproved = (request: any) => {
    setSuccessMsg(
      `Borrow request for "${request?.book?.title || "this book"}" approved`
    );
    setQrApprovalTarget(null);
    loadRequests();
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const openRejectModal = (request: any) => {
    setRejectTarget(request);
    setRejectReason("");
    setRejectError("");
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError("A rejection reason is required");
      return;
    }
    setRejectLoading(true);
    setRejectError("");
    try {
      const res = await api.rejectRequest(rejectTarget.id, reason);
      if (res.success) {
        setRejectTarget(null);
        setRejectReason("");
        setSuccessMsg("Borrow request rejected");
        loadRequests();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setRejectError(res.error || "Failed to reject request");
      }
    } catch {
      setRejectError("Failed to reject request");
    } finally {
      setRejectLoading(false);
    }
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const txnTotalPages = Math.max(1, Math.ceil(txnTotal / PAGE_SIZE));
  const reqTotalPages = Math.max(1, Math.ceil(reqTotal / PAGE_SIZE));

  const getTxnPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, txnPage - Math.floor(maxVisible / 2));
    const end = Math.min(txnTotalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const getReqPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, reqPage - Math.floor(maxVisible / 2));
    const end = Math.min(reqTotalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
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

{/* ===================================================== */}
          {/* SECTION 1 — My Borrowed Books (borrowers only) */}
          {/* ===================================================== */}
          {!isLibrarian && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">My Borrowed Books</h1>
                <p className="text-sm text-zinc-400 mt-1">
                  {isLibrarian ? "All borrowing activity" : "Your currently borrowed and recently returned books"}
                  {" · "}{txnTotal} record{txnTotal !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={txnSearch}
                    onChange={(e) => setTxnSearch(e.target.value)}
                    placeholder="Search by book title..."
                    className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <select
                  value={txnStatusFilter}
                  onChange={(e) => setTxnStatusFilter(e.target.value)}
                  className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                >
                  <option value="" className="bg-zinc-900 text-white">All Status</option>
                  <option value="ACTIVE" className="bg-zinc-900 text-white">Borrowed</option>
                  <option value="OVERDUE" className="bg-zinc-900 text-white">Overdue</option>
                  <option value="RETURNED" className="bg-zinc-900 text-white">Returned</option>
                </select>
              </div>
            </div>

            {txnLoading && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 bg-zinc-900 animate-pulse border-b border-zinc-800/40" />
                ))}
              </div>
            )}

            {!txnLoading && txns.length === 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-12 h-12 text-zinc-600 mb-4" />
                <p className="text-zinc-300 font-medium">No borrowed books found</p>
                <p className="text-sm text-zinc-500 mt-1">
                  {txnSearch || txnStatusFilter ? "Try adjusting your search or filters" : "Borrowed books will appear here"}
                </p>
              </div>
            )}

            {!txnLoading && txns.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
                        <th className="px-6 py-3 font-medium">Book</th>
                        <th className="px-6 py-3 font-medium hidden sm:table-cell">Accession</th>
                        <th className="px-6 py-3 font-medium hidden sm:table-cell">Borrow Date</th>
                        <th className="px-6 py-3 font-medium hidden md:table-cell">Due Date</th>
                        <th className="px-6 py-3 font-medium hidden md:table-cell">Return Date</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Fine</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txns.map((txn: any) => (
                        <tr key={txn.id} className="border-t border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-zinc-100 font-medium">{txn.book?.title || "Unknown"}</p>
                            <p className="text-xs text-zinc-500">{txn.book?.author || ""}</p>
                          </td>
                          <td className="px-6 py-4 text-zinc-400 hidden sm:table-cell">{txn.book?.accessionNo || "—"}</td>
                          <td className="px-6 py-4 text-zinc-400 hidden sm:table-cell">{formatDate(txn.borrowDate)}</td>
                          <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{formatDate(txn.dueDate)}</td>
                          <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{formatDate(txn.returnDate)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${txnStatusBadge[txn.status] || "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30"}`}>
                              {txnStatusLabel[txn.status] || txn.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-medium ${txn.fineAmount > 0 ? "text-amber-400" : "text-zinc-500"}`}>
                              {txn.fineAmount ? `₱${txn.fineAmount.toFixed(2)}` : "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {!isLibrarian && txn.status === "ACTIVE" && (
                                <button
                                  onClick={() => handleReturn(txn)}
                                  disabled={actionLoadingId !== null}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> {actionLoadingId === txn.id ? "Returning..." : "Return"}
                                </button>
                              )}
                              {!isLibrarian && txn.status === "OVERDUE" && !txn.finePaid && txn.fineAmount > 0 && (
                                <button
                                  onClick={() => handlePayFine(txn)}
                                  disabled={actionLoadingId !== null}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Coins className="w-3.5 h-3.5" /> {actionLoadingId === txn.id ? "Paying..." : "Pay Fine"}
                                </button>
                              )}
                              {isLibrarian && txn.status === "ACTIVE" && (
                                <>
                                  <button
                                    onClick={() => handleReturn(txn)}
                                    disabled={actionLoadingId !== null}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> {actionLoadingId === txn.id ? "Returning..." : "Return"}
                                  </button>
                                  <button
                                    onClick={() => openMissingModal(txn)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-medium rounded-lg transition-colors"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" /> Declare Missing
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!txnLoading && txns.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-zinc-500">
                  Showing{" "}
                  <span className="text-zinc-300">
                    {(txnPage - 1) * PAGE_SIZE + 1}–{Math.min(txnPage * PAGE_SIZE, txnTotal)}
                  </span>{" "}
                  of <span className="text-zinc-300">{txnTotal}</span> records
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
                    disabled={txnPage === 1}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getTxnPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setTxnPage(page)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        page === txnPage
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setTxnPage((p) => Math.min(txnTotalPages, p + 1))}
                    disabled={txnPage === txnTotalPages}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
)}
          </div>
          )}

          {/* Divider (only when borrowers see the borrowed books section) */}
          {!isLibrarian && <div className="border-t border-zinc-800 mb-8" />}

          {/* ===================================================== */}
          {/* SECTION 2 — Borrow Requests */}
          {/* ===================================================== */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Borrow Requests</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Review and manage book borrowing requests · {reqTotal} total
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={reqSearch}
                    onChange={(e) => setReqSearch(e.target.value)}
                    placeholder="Search by book or member..."
                    className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <select
                  value={reqStatusFilter}
                  onChange={(e) => setReqStatusFilter(e.target.value)}
                  className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                >
                  <option value="" className="bg-zinc-900 text-white">All Status</option>
                  <option value="PENDING" className="bg-zinc-900 text-white">Pending</option>
                  <option value="APPROVED" className="bg-zinc-900 text-white">Approved</option>
                  <option value="REJECTED" className="bg-zinc-900 text-white">Rejected</option>
                </select>
              </div>
            </div>

            {reqLoading && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 bg-zinc-900 animate-pulse border-b border-zinc-800/40" />
                ))}
              </div>
            )}

            {!reqLoading && records.length === 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-12 h-12 text-zinc-600 mb-4" />
                <p className="text-zinc-300 font-medium">No borrow requests found</p>
                <p className="text-sm text-zinc-500 mt-1">
                  {reqSearch || reqStatusFilter ? "Try adjusting your search or filters" : "Borrow requests will appear here"}
                </p>
              </div>
            )}

            {!reqLoading && records.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
                        <th className="px-6 py-3 font-medium">Book</th>
                        <th className="px-6 py-3 font-medium hidden md:table-cell">Member</th>
                        <th className="px-6 py-3 font-medium hidden sm:table-cell">Request Date</th>
                        <th className="px-6 py-3 font-medium">Notes</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((req: any) => (
                        <tr key={req.id} className="border-t border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-zinc-100 font-medium">{req.book?.title || "Unknown"}</p>
                            <p className="text-xs text-zinc-500">{req.book?.accessionNo || ""}</p>
                          </td>
                          <td className="px-6 py-4 text-zinc-300 hidden md:table-cell">
                            {req.user?.firstName} {req.user?.lastName}
                            <p className="text-xs text-zinc-500">{req.user?.libraryId || ""}</p>
                          </td>
                          <td className="px-6 py-4 text-zinc-400 hidden sm:table-cell">{formatDate(req.requestDate)}</td>
                          <td className="px-6 py-4 text-zinc-400 max-w-[180px] truncate">
                            {req.notes || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${reqStatusBadge[req.status] || "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30"}`}>
                              {reqStatusLabel[req.status] || req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {isLibrarian && req.status === "PENDING" && (
                                <>
                                  <button
                                    onClick={() => handleApprove(req)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    <QrCode className="w-3.5 h-3.5" /> Approve via QR
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(req)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-medium rounded-lg transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </>
                              )}
                              {!isLibrarian && req.status === "PENDING" && (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                                  <Clock className="w-3.5 h-3.5" /> Awaiting approval
                                </span>
                              )}
                              {!isLibrarian && req.status !== "PENDING" && (
                                <span className="text-xs text-zinc-500">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!reqLoading && records.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-zinc-500">
                  Showing{" "}
                  <span className="text-zinc-300">
                    {(reqPage - 1) * PAGE_SIZE + 1}–{Math.min(reqPage * PAGE_SIZE, reqTotal)}
                  </span>{" "}
                  of <span className="text-zinc-300">{reqTotal}</span> records
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReqPage((p) => Math.max(1, p - 1))}
                    disabled={reqPage === 1}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getReqPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setReqPage(page)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        page === reqPage
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setReqPage((p) => Math.min(reqTotalPages, p + 1))}
                    disabled={reqPage === reqTotalPages}
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

      {/* Reject Borrow Request modal (librarian only) */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative z-50 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/50">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Reject Borrow Request</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Reject the request for "{rejectTarget.book?.title || "this book"}"? A reason is required.
                </p>
              </div>
            </div>

            {rejectError && (
              <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{rejectError}</div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Book not available, exceeding borrow limit"
                rows={3}
                className="flex w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl border border-zinc-700 transition-colors"
                disabled={rejectLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-600/30 transition-colors"
                disabled={rejectLoading}
              >
                {rejectLoading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

{/* Declare Missing confirmation modal (librarian only) */}
      {missingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMissingTarget(null)} />
          <div className="relative z-50 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/50">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Declare Book Missing</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Mark "{missingTarget.book?.title || "this book"}" as missing? This will set the book status to lost and close the transaction.
                </p>
              </div>
            </div>

            {missingError && (
              <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{missingError}</div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Reason <span className="text-zinc-500">(optional)</span>
              </label>
              <textarea
                value={missingReason}
                onChange={(e) => setMissingReason(e.target.value)}
                placeholder="e.g., Not returned by borrower, lost in transit"
                rows={3}
                className="flex w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMissingTarget(null)}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl border border-zinc-700 transition-colors"
                disabled={missingLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeclareMissing}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-amber-600/30 transition-colors"
                disabled={missingLoading}
              >
                {missingLoading ? "Declaring..." : "Declare Missing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Approval modal (librarian only) — shows a unique QR the borrower
          scans with their phone to confirm and approve the request. */}
      {qrApprovalTarget && (
        <QRApprovalModal
          request={qrApprovalTarget}
          onClose={() => setQrApprovalTarget(null)}
          onApproved={() => handleQRApproved(qrApprovalTarget)}
        />
      )}
    </div>
  );
}
