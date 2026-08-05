"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

const PAGE_SIZE = 15;

const ACTION_OPTIONS = [
  "LOGIN",
  "REGISTER",
  "LOGOUT",
  "BORROW_REQUEST",
  "APPROVE_REQUEST",
  "REJECT_REQUEST",
  "RETURN_BOOK",
  "RESERVE_BOOK",
  "CANCEL_RESERVATION",
  "CREATE_USER",
  "UPDATE_BOOK",
  "DELETE_USER",
];

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const isLibrarian = user?.role === "LIBRARIAN";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (userFilter) params.userId = userFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await api.get<any>(`/activities?${new URLSearchParams(params).toString()}`);
      if (res.success) {
        setActivities((res.data as any[]) || []);
        setTotal(res.meta?.total ?? ((res.data as any[]) || []).length);
      }
    } catch {
      setError("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, userFilter, fromDate, toDate, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, userFilter, fromDate, toDate]);

  const formatTimestamp = (d?: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) +
      " · " + date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  };

  const formatAction = (action: string) =>
    action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const actionBadge: Record<string, string> = {
    LOGIN: "bg-blue-500/15 text-blue-400 ring-blue-500/30",
    REGISTER: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
    TOKEN_REFRESH: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/30",
    LOGOUT: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30",
    BORROW_REQUEST: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/30",
    APPROVE_REQUEST: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
    REJECT_REQUEST: "bg-red-500/15 text-red-400 ring-red-500/30",
    RETURN_BOOK: "bg-purple-500/15 text-purple-400 ring-purple-500/30",
    RESERVE_BOOK: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
    CANCEL_RESERVATION: "bg-orange-500/15 text-orange-400 ring-orange-500/30",
    CREATE_USER: "bg-teal-500/15 text-teal-400 ring-teal-500/30",
    UPDATE_BOOK: "bg-violet-500/15 text-violet-400 ring-violet-500/30",
    DELETE_USER: "bg-rose-500/15 text-rose-400 ring-rose-500/30",
    SYSTEM: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30",
  };

  const formatDetails = (details?: any) => {
    if (!details) return "-";
    try {
      if (typeof details === "string") return details;
      const str = JSON.stringify(details);
      return str.length > 120 ? str.substring(0, 120) + "…" : str;
    } catch {
      return "-";
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="p-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Track all system activities and user actions ({total} total)
              </p>
            </div>
            {(search || actionFilter || userFilter || fromDate || toDate) && (
              <button
                onClick={() => {
                  setSearch("");
                  setActionFilter("");
                  setUserFilter("");
                  setFromDate("");
                  setToDate("");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Filter className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search activities..."
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
              >
                <option value="" className="bg-zinc-900 text-white">All Actions</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a} className="bg-zinc-900 text-white">
                    {formatAction(a)}
                  </option>
                ))}
              </select>
              {isLibrarian && (
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                >
                  <option value="" className="bg-zinc-900 text-white">All Users</option>
                  {Array.from(new Map(activities.map((a) => [a.user?.id, a.user])).values())
                    .filter(Boolean)
                    .map((u: any) => (
                      <option key={u.id} value={u.id} className="bg-zinc-900 text-white">
                        {u.firstName} {u.lastName} ({u.libraryId})
                      </option>
                    ))}
                </select>
              )}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 bg-zinc-900 animate-pulse border-b border-zinc-800/40" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && activities.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 flex flex-col items-center justify-center py-20 text-center">
              <ScrollText className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-300 font-medium">No activity logs found</p>
              <p className="text-sm text-zinc-500 mt-1">
                {search || actionFilter || userFilter || fromDate || toDate
                  ? "Try adjusting your search or filters"
                  : "System activities will appear here"}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && activities.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
                      <th className="px-6 py-3 font-medium">Timestamp</th>
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-6 py-3 font-medium">Action</th>
                      <th className="px-6 py-3 font-medium hidden lg:table-cell">Details</th>
                      <th className="px-6 py-3 font-medium hidden md:table-cell">IP Address</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((log: any) => (
                      <tr key={log.id} className="border-t border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                        <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">{formatTimestamp(log.createdAt)}</td>
                        <td className="px-6 py-4">
                          <p className="text-zinc-100 font-medium">
                            {log.user?.firstName} {log.user?.lastName || "System"}
                          </p>
                          <p className="text-xs text-zinc-500">{log.user?.libraryId || "—"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${actionBadge[log.action] || "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30"}`}>
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 max-w-[280px] truncate hidden lg:table-cell">
                          {formatDetails(log.details)}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 hidden md:table-cell font-mono text-xs">
                          {log.ipAddress || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 bg-emerald-500/15 text-emerald-400 ring-emerald-500/30">
                            Success
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && activities.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-zinc-500">
                Showing{" "}
                <span className="text-zinc-300">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, total)}
                </span>{" "}
                of <span className="text-zinc-300">{total}</span> logs
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
        </div>
      </div>
    </div>
  );
}
