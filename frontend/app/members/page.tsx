"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { useDebounce } from "@/lib/useDebounce";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
Phone,
} from "lucide-react";

const PAGE_SIZE = 10;

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [finesMap, setFinesMap] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedStatus = useDebounce(statusFilter, 300);

  const isLibrarian = user?.role === "LIBRARIAN";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (debouncedStatus) params.isActive = debouncedStatus === "active" ? "true" : "false";

const [usersRes, statsRes] = await Promise.all([
        api.get<any>("/auth/users?" + new URLSearchParams(params).toString()),
        api.getDashboardStats(),
      ]);

      if (usersRes.success) {
        setMembers((usersRes.data as any[]) || []);
        setTotal(usersRes.meta?.total ?? ((usersRes.data as any[]) || []).length);
      } else if (usersRes.rateLimited) {
        setError("You're moving too fast. Please wait a moment and try again.");
      }

      if (statsRes.success && statsRes.data?.overdueByUser) {
        const map: Record<string, number> = {};
        for (const o of statsRes.data.overdueByUser) {
          map[o.userId] = o.totalFine ?? 0;
        }
        setFinesMap(map);
      }
    } catch {
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, debouncedStatus, currentPage]);

  useEffect(() => {
    if (user && user.role !== "LIBRARIAN") {
      // non-librarians shouldn't manage members
      window.location.href = "/student/dashboard";
      return;
    }
    loadData();
  }, [user, loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, debouncedStatus]);

const handleDelete = async (member: any) => {
    if (!window.confirm(`Delete member "${member.firstName} ${member.lastName}"? This action cannot be undone.`)) return;
    if (deletingId) return; // prevent double-click spam
    setDeletingId(member.id);
    try {
      const res = await api.delete(`/auth/users/${member.id}`);
      if (res.success) {
        setSuccessMsg("Member deleted successfully");
        loadData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else if (res.rateLimited) {
        setError("You're moving too fast. Please wait a moment and try again.");
      } else {
        setError(res.error || "Failed to delete member");
      }
    } catch {
      setError("Failed to delete member");
    } finally {
      setDeletingId(null);
    }
  };

  const getFullName = (m: any) => `${m?.firstName || ""} ${m?.lastName || ""}`.trim() || "—";
  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const formatPhone = (p?: string) => p || "—";

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
              <h1 className="text-2xl font-bold text-white">Members</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Manage library members ({total} total)
              </p>
            </div>
            {isLibrarian && (
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-colors">
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            )}
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
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
              >
                <option value="" className="bg-zinc-900 text-white">All Status</option>
                <option value="active" className="bg-zinc-900 text-white">Active</option>
                <option value="inactive" className="bg-zinc-900 text-white">Inactive</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 bg-zinc-900 animate-pulse border-b border-zinc-800/40" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && members.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-300 font-medium">No members found</p>
              <p className="text-sm text-zinc-500 mt-1">
                {search || statusFilter ? "Try adjusting your search or filters" : "Add a member to get started"}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && members.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium hidden md:table-cell">Email</th>
                      <th className="px-6 py-3 font-medium hidden lg:table-cell">Phone</th>
                      <th className="px-6 py-3 font-medium hidden sm:table-cell">Join Date</th>
                      <th className="px-6 py-3 font-medium">Fines</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m: any) => (
                      <tr key={m.id} className="border-t border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-500/15 text-blue-300 flex items-center justify-center font-semibold text-xs shrink-0">
                              {m.firstName?.charAt(0)}{m.lastName?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-zinc-100 font-medium truncate">{getFullName(m)}</p>
                              <p className="text-xs text-zinc-500">{m.libraryId || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300 hidden md:table-cell">{m.email || "—"}</td>
                        <td className="px-6 py-4 text-zinc-400 hidden lg:table-cell">
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-zinc-600" />
                            {formatPhone(m.phone)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 hidden sm:table-cell">{formatDate(m.createdAt)}</td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${finesMap[m.id] > 0 ? "text-amber-400" : "text-zinc-400"}`}>
                            ₱ {(finesMap[m.id] ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                            m.isActive
                              ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
                              : "bg-red-500/15 text-red-400 ring-red-500/30"
                          }`}>
                            {m.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors" aria-label="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              disabled={deletingId !== null}
                              className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Delete"
                            >
                              <Trash2 className={`w-4 h-4 ${deletingId === m.id ? "animate-spin" : ""}`} />
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
          {!loading && members.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-zinc-500">
                Showing{" "}
                <span className="text-zinc-300">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, total)}
                </span>{" "}
                of <span className="text-zinc-300">{total}</span> members
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
