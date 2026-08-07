"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotificationBell from "@/components/NotificationBell";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookMarked,
  Clock,
  Coins,
  User,
  Settings,
  LogOut,
} from "lucide-react";

const statusBadge: Record<string, string> = {
  ACTIVE: "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  RETURNED: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  OVERDUE: "bg-red-500/15 text-red-400 ring-red-500/30",
  PENDING: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  REJECTED: "bg-red-500/15 text-red-400 ring-red-500/30",
  CANCELLED: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30",
};

function StatCard({ title, value, icon: Icon, accent }: any) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-zinc-400">{title}</p>
    </div>
  );
}

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
const [statsRes, txRes] = await Promise.all([
          api.getMyDashboardStats(),
          api.getTransactions({ limit: "5" }),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        setRecentTransactions(txRes.success ? (txRes.data || []) : []);
      } catch {
        // silent fail for demo
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const role = user?.role || "STUDENT";
  const isFaculty = role === "FACULTY";

const statsCards = [
    { title: "Currently Borrowed", value: stats?.myBorrowed ?? "-", icon: BookMarked, accent: "bg-blue-500/15 text-blue-400" },
    { title: "Pending Requests", value: stats?.myPendingRequests ?? "-", icon: Clock, accent: "bg-amber-500/15 text-amber-400" },
    { title: "Overdue Fines", value: `₱${stats?.myFines ?? 0}`, icon: Coins, accent: "bg-red-500/15 text-red-400" },
  ];

const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <ProtectedRoute roles={["STUDENT", "FACULTY"]}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome, {user?.firstName || "Student"}
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                  {isFaculty ? "Faculty Library Portal" : "Student Library Portal"}
                  <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 bg-blue-500/15 text-blue-400 ring-blue-500/30">
                    {isFaculty ? "Faculty" : "Student"}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen((o) => !o)}
                    className="w-10 h-10 ml-1 rounded-xl bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
                  >
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-52 z-40 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden">
                        <div className="px-4 py-3 border-b border-zinc-800">
                          <p className="text-sm font-semibold text-white">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">{user?.role}</p>
                        </div>
                        <div className="p-1.5">
                          <Link
                            href="/profile"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                          >
                            <User className="w-4 h-4" />
                            Profile
                          </Link>
                          <button
                            onClick={() => { setProfileOpen(false); router.push("/profile/settings"); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </button>
                          <div className="my-1.5 border-t border-zinc-800" />
                          <button
                            onClick={async () => {
                              setProfileOpen(false);
                              await logout();
                              router.push("/login");
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Log out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-2xl bg-zinc-900 animate-pulse" />
                  ))
                : statsCards.map((card) => (
                    <StatCard key={card.title} {...card} />
                  ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 gap-6">
              {/* Recent Transactions */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
<div>
                    <h2 className="text-base font-semibold text-white">Recent Transactions</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Your latest borrowing activity</p>
                  </div>
                  <Link href="/requests" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    View all
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
                        <th className="px-6 py-3 font-medium">Book</th>
                        <th className="px-6 py-3 font-medium">Borrow Date</th>
                        <th className="px-6 py-3 font-medium">Due Date</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-zinc-500">
                            No recent transactions
                          </td>
                        </tr>
                      ) : (
                        recentTransactions.map((tx: any) => (
                          <tr key={tx.id} className="border-t border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-zinc-100 font-medium">{tx.book?.title || "Unknown Book"}</p>
                              <p className="text-xs text-zinc-500">{tx.book?.author || ""}</p>
                            </td>
                            <td className="px-6 py-4 text-zinc-400">{formatDate(tx.borrowDate)}</td>
                            <td className="px-6 py-4 text-zinc-400">{formatDate(tx.dueDate)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusBadge[tx.status] || "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30"}`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
