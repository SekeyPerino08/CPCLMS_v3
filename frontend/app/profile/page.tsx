"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import api from "@/lib/api";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function TransactionList({
  transactions,
}: {
  transactions: any[];
}) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center py-8">
        No borrowing history
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium text-zinc-800">
                {tx.book?.title || "Unknown"}
              </p>
              <p className="text-xs text-zinc-400">
                Borrowed: {formatDate(tx.borrowDate)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={tx.status} />
              {tx.fineAmount > 0 && (
                <span className="text-xs text-red-500">
                  Php {tx.fineAmount}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReservationList({
  reservations,
}: {
  reservations: any[];
}) {
  if (reservations.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center py-8">
        No active reservations
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {reservations.map((res) => {
        return (
          <div
            key={res.id}
            className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium text-zinc-800">
                {res.book?.title || "Unknown"}
              </p>
              <p className="text-xs text-zinc-400">
                Reserved: {formatDate(res.reservationDate)}
              </p>
            </div>
            <StatusBadge status={res.status} />
          </div>
        );
      })}
    </div>
  );
}

function NotificationList({
  notifications,
}: {
  notifications: any[];
}) {
  if (notifications.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center py-8">
        No notifications
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {notifications.map((n) => {
        return (
          <div
            key={n.id}
            className={
              "p-3 rounded-lg text-sm " +
              (n.isRead
                ? "bg-zinc-50"
                : "bg-emerald-50 border border-emerald-200")
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-zinc-800">{n.title}</p>
                {n.message && (
                  <p className="text-xs text-zinc-500">{n.message}</p>
                )}
              </div>
              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {formatDate(n.createdAt)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("transactions");

  const role = user?.role || "STUDENT";
  const initials =
    (user?.firstName?.charAt(0) || "U") +
    (user?.lastName?.charAt(0) || "");

  useEffect(() => {
    async function load() {
      try {
        const [txRes, resRes, notifRes] = await Promise.all([
          api.getTransactions(),
          api.getReservations(),
          api.getNotifications(),
        ]);
        if (txRes.success && txRes.data) setTransactions(txRes.data);
        if (resRes.success && resRes.data) setReservations(resRes.data);
        if (notifRes.success && notifRes.data)
          setNotifications(notifRes.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const tabs = [
    { key: "transactions", label: "Borrowed" },
    { key: "reservations", label: "Reserved" },
    { key: "notifications", label: "Notifications" },
  ];

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700 mx-auto mb-4">
                  {initials.toUpperCase()}
                </div>
                <h2 className="text-lg font-semibold text-zinc-800">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-zinc-500">{user?.email}</p>
                <p className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  {role === "LIBRARIAN"
                    ? "Librarian"
                    : role === "FACULTY"
                    ? "Faculty"
                    : "Student"}
                </p>
                <div className="mt-6 space-y-2 text-sm text-left">
                  <div className="flex justify-between py-2 border-b border-zinc-100">
                    <span className="text-zinc-500">Library ID</span>
                    <span className="font-mono text-zinc-800">
                      {user?.libraryId || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100">
                    <span className="text-zinc-500">Department</span>
                    <span className="text-zinc-800">
                      {user?.department || "N/A"}
                    </span>
                  </div>
                  {role === "STUDENT" && (
                    <div className="flex justify-between py-2 border-b border-zinc-100">
                      <span className="text-zinc-500">Year/Section</span>
                      <span className="text-zinc-800">
                        {user?.yearSection || "N/A"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-zinc-100">
                    <span className="text-zinc-500">Phone</span>
                    <span className="text-zinc-800">
                      {user?.phone || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-zinc-500">Member Since</span>
                    <span className="text-zinc-800">
                      {formatDate(user?.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Activity</CardTitle>
                  <div className="flex gap-1 p-1 bg-zinc-100 rounded-lg">
                    {tabs.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={
                          "px-3 py-1.5 rounded-md text-xs font-medium " +
                          (tab === t.key
                            ? "bg-white shadow-sm text-zinc-800"
                            : "text-zinc-500")
                        }
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading && (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 bg-zinc-100 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                )}
                {!loading && tab === "transactions" && (
                  <TransactionList transactions={transactions} />
                )}
                {!loading && tab === "reservations" && (
                  <ReservationList reservations={reservations} />
                )}
                {!loading && tab === "notifications" && (
                  <NotificationList notifications={notifications} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
