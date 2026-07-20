"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import api from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, txRes] = await Promise.all([
          api.getDashboardStats(),
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

  const librarianLinks = [
    { href: "/books", label: "Manage Books", icon: "📚" },
    { href: "/requests", label: "Borrow Requests", icon: "📋" },
    { href: "/transactions", label: "Transactions", icon: "🔄" },
    { href: "/reservations", label: "Reservations", icon: "📅" },
    { href: "/policies", label: "Library Policies", icon: "⚙️" },
    { href: "/reports", label: "Reports & Analytics", icon: "📊" },
    { href: "/activities", label: "Activity Logs", icon: "📝" },
  ];

  const studentFacultyLinks = [
    { href: "/books", label: "Browse Books", icon: "📚" },
    { href: "/requests", label: "My Requests", icon: "📋" },
    { href: "/transactions", label: "My Transactions", icon: "🔄" },
    { href: "/reservations", label: "My Reservations", icon: "📅" },
    { href: "/profile", label: "My Profile", icon: "👤" },
  ];

  const links = role === "LIBRARIAN" ? librarianLinks : studentFacultyLinks;

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-800">Welcome, {user?.firstName || "User"}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {role === "LIBRARIAN" ? "Library Management Dashboard" : "Your Library Portal"}
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              {role === "LIBRARIAN" ? "Librarian" : role === "FACULTY" ? "Faculty" : "Student"}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-zinc-100 rounded-xl animate-pulse" />)
          ) : role === "LIBRARIAN" ? (
            <>
              <StatCard title="Total Books" value={stats?.totalBooks ?? "-"} icon="📚" variant="emerald" />
              <StatCard title="Borrowed Books" value={stats?.borrowedBooks ?? "-"} icon="📖" variant="blue" />
              <StatCard title="Active Members" value={stats?.activeMembers ?? "-"} icon="👥" />
              <StatCard title="Pending Requests" value={stats?.pendingRequests ?? "-"} icon="⏳" variant="amber" />
            </>
          ) : (
            <>
              <StatCard title="Currently Borrowed" value={stats?.myBorrowed ?? "-"} icon="📖" variant="blue" />
              <StatCard title="Pending Requests" value={stats?.myPendingRequests ?? "-"} icon="⏳" variant="amber" />
              <StatCard title="Active Reservations" value={stats?.myReservations ?? "-"} icon="📅" />
              <StatCard title="Overdue Fines" value={`Php ${stats?.myFines ?? 0}`} icon="💰" variant={stats?.myFines > 0 ? "amber" : "default"} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-8">No recent transactions</p>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-800 truncate">{tx.book?.title || "Unknown Book"}</p>
                          <p className="text-xs text-zinc-400">{tx.user?.firstName} {tx.user?.lastName}</p>
                        </div>
                        <StatusBadge status={tx.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
              <CardContent>
                <nav className="space-y-1">
                  {links.map((link) => (
                    <Link key={link.href} href={link.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-700 hover:bg-zinc-100 transition-colors">
                      <span className="text-lg">{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>
      </div>
    </ProtectedRoute>
  );
}
