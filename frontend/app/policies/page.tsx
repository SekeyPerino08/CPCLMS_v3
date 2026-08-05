"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Plus,
  Pencil,
  Eye,
  Shield,
  ChevronLeft,
  ChevronRight,
  Clock,
X,
} from "lucide-react";

const PAGE_SIZE = 10;

const CATEGORY_MAP: Record<string, { label: string; badge: string }> = {
  MAX_BORROW_DAYS: { label: "Borrowing", badge: "bg-blue-500/15 text-blue-400 ring-blue-500/30" },
  FACULTY_MAX_BORROW_DAYS: { label: "Borrowing", badge: "bg-blue-500/15 text-blue-400 ring-blue-500/30" },
  MAX_BOOKS_PER_USER: { label: "Borrowing", badge: "bg-blue-500/15 text-blue-400 ring-blue-500/30" },
  FACULTY_MAX_BOOKS: { label: "Borrowing", badge: "bg-blue-500/15 text-blue-400 ring-blue-500/30" },
  MAX_RESERVATION_DAYS: { label: "Borrowing", badge: "bg-blue-500/15 text-blue-400 ring-blue-500/30" },
  RESERVATION_QUEUE_LIMIT: { label: "Borrowing", badge: "bg-blue-500/15 text-blue-400 ring-blue-500/30" },
  FINE_PER_DAY: { label: "Fines", badge: "bg-amber-500/15 text-amber-400 ring-amber-500/30" },
  LIBRARY_OPEN_TIME: { label: "General", badge: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
  LIBRARY_CLOSE_TIME: { label: "General", badge: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
};

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  MAX_BORROW_DAYS: "Max days a student can borrow a book",
  FACULTY_MAX_BORROW_DAYS: "Max days a faculty member can borrow a book",
  MAX_BOOKS_PER_USER: "Maximum active books per student",
  FACULTY_MAX_BOOKS: "Maximum active books per faculty member",
  FINE_PER_DAY: "Daily overdue fine amount in pesos",
  MAX_RESERVATION_DAYS: "Number of days a reservation is held",
  RESERVATION_QUEUE_LIMIT: "Maximum active reservations per book",
  LIBRARY_OPEN_TIME: "Library opening time (HH:MM)",
  LIBRARY_CLOSE_TIME: "Library closing time (HH:MM)",
};

export default function PoliciesPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState("");

  // Add / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [formKey, setFormKey] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  // View modal state
  const [viewPolicy, setViewPolicy] = useState<any>(null);

  const isLibrarian = user?.role === "LIBRARIAN";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getPolicies();
      if (res.success) {
        setPolicies((res.data as any[]) || []);
      } else {
        setError(res.error || "Failed to load policies");
      }
    } catch {
      setError("Failed to load policies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const getCategory = (key: string) => CATEGORY_MAP[key]?.label || "General";
  const getCategoryBadge = (key: string) => CATEGORY_MAP[key]?.badge || "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30";
  const getDescription = (policy: any) => policy.description || DEFAULT_DESCRIPTIONS[policy.key] || "Library configuration setting";

  const filtered = policies.filter((p) => {
    const matchesSearch =
      !search ||
      p.key.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || getCategory(p.key) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const formatUpdated = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const openAdd = () => {
    setEditKey(null);
    setFormKey("");
    setFormValue("");
    setFormDescription("");
    setFormCategory("general");
    setModalOpen(true);
  };

  const openEdit = (policy: any) => {
    setEditKey(policy.key);
    setFormKey(policy.key);
    setFormValue(policy.value);
    setFormDescription(policy.description || "");
    setFormCategory(getCategory(policy.key).toLowerCase());
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formKey.trim()) {
      setError("Policy key is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await api.updatePolicy(formKey.trim().toUpperCase(), formValue, formDescription);
      if (res.success) {
        setSuccessMsg(editKey ? "Policy updated successfully" : "Policy added successfully");
        setModalOpen(false);
        loadData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(res.error || "Failed to save policy");
      }
    } catch {
      setError("Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

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
              <h1 className="text-2xl font-bold text-white">Library Policies</h1>
              <p className="text-sm text-zinc-400 mt-1">
                View and manage library rules and guidelines ({policies.length} total)
              </p>
            </div>
{isLibrarian && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Policy
              </button>
            )}
          </div>

          {/* Controls */}
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
                  placeholder="Search policies..."
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
              >
                <option value="" className="bg-zinc-900 text-white">All Categories</option>
                <option value="Borrowing" className="bg-zinc-900 text-white">Borrowing</option>
                <option value="Fines" className="bg-zinc-900 text-white">Fines</option>
                <option value="General" className="bg-zinc-900 text-white">General</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 bg-zinc-900 animate-pulse rounded-2xl border border-zinc-800" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 flex flex-col items-center justify-center py-20 text-center">
              <Shield className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-300 font-medium">No policies found</p>
              <p className="text-sm text-zinc-500 mt-1">
                {search || categoryFilter ? "Try adjusting your search or filters" : "Add a policy to get started"}
              </p>
            </div>
          )}

          {/* Policy Cards */}
          {!loading && paginated.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginated.map((policy: any) => (
                <div
                  key={policy.id}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 hover:border-zinc-700 hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getCategoryBadge(policy.key)}`}>
                        {getCategory(policy.key)}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {formatUpdated(policy.updatedAt)}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white mb-1">{policy.key.replace(/_/g, " ")}</h3>
                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{getDescription(policy)}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500">Current Value</p>
                      <p className="text-xl font-bold text-blue-400">{policy.value}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewPolicy(policy)}
                        className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                        aria-label="View policy"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isLibrarian && (
                        <button
                          onClick={() => openEdit(policy)}
                          className="p-2 rounded-lg text-zinc-400 hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                          aria-label="Edit policy"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <p className="text-sm text-zinc-500">
                Showing{" "}
                <span className="text-zinc-300">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of <span className="text-zinc-300">{filtered.length}</span> policies
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">
                {editKey ? "Edit Policy" : "Add Policy"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Policy Key</label>
                <input
                  type="text"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  disabled={!!editKey}
                  placeholder="e.g. MAX_BORROW_DAYS"
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="borrowing" className="bg-zinc-900 text-white">Borrowing</option>
                  <option value="fines" className="bg-zinc-900 text-white">Fines</option>
                  <option value="general" className="bg-zinc-900 text-white">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Value</label>
                <input
                  type="text"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="e.g. 14"
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description of this policy"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : editKey ? "Save Changes" : "Add Policy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewPolicy && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">{viewPolicy.key.replace(/_/g, " ")}</h3>
              <button onClick={() => setViewPolicy(null)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getCategoryBadge(viewPolicy.key)}`}>
                  {getCategory(viewPolicy.key)}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-300 mb-1">Description</p>
                <p className="text-sm text-zinc-400">{getDescription(viewPolicy)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Current Value</p>
                  <p className="text-xl font-bold text-blue-400">{viewPolicy.value}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Last Updated</p>
                  <p className="text-sm text-zinc-300">{formatUpdated(viewPolicy.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              {isLibrarian && (
                <button
                  onClick={() => { const p = viewPolicy; setViewPolicy(null); openEdit(p); }}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Edit Policy
                </button>
              )}
              <button
                onClick={() => setViewPolicy(null)}
                className="px-4 py-2 text-sm border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
