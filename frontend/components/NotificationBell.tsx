"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, BellOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message?: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const POLL_INTERVAL_MS = 15000;

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [listRes, countRes] = await Promise.all([
        api.getNotifications({ limit: "20" }),
        api.getUnreadCount(),
      ]);
      if (listRes.success && listRes.data) {
        const payload = listRes.data as any;
        setNotifications(payload.notifications || []);
      }
      if (countRes.success && countRes.data) {
        setUnreadCount((countRes.data as any).unreadCount ?? 0);
      }
    } catch {
      // Silent — don't break the UI if polling fails
    }
  }, [user]);

  // Initial load + polling
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      setLoading(true);
      await loadNotifications();
      // Mark all as read once the panel is opened
      try {
        await api.markAllNotificationsRead();
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch {
        // Ignore
      }
      setLoading(false);
    }
  };

  const handleClickNotification = async (n: NotificationItem) => {
    // Optionally mark this notification as read when clicked
    if (!n.isRead) {
      try {
        await api.markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
        );
      } catch {
        // Ignore
      }
    }

    setOpen(false);

    // Redirect to the Borrow Requests page
    router.push("/requests");
  };

  const hasUnread = unreadCount > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className={`relative w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors ${
          open ? "text-white border-zinc-700" : ""
        }`}
      >
        <Bell className="w-5 h-5" />

        {/* Red badge with unread count */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-zinc-950 shadow-lg shadow-red-500/40">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 z-40 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {hasUnread && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-500/15 text-red-400 ring-1 ring-red-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={async () => {
                  try {
                    await api.markAllNotificationsRead();
                    setUnreadCount(0);
                    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                  } catch {
                    // Ignore
                  }
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>

            {/* Notification list */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-zinc-800 animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <BellOff className="w-8 h-8 text-zinc-600 mb-3" />
                  <p className="text-sm text-zinc-400 font-medium">No notifications yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Updates will appear here</p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-800/60">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => handleClickNotification(n)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleClickNotification(n);
                        }
                      }}
                      className={`flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer ${
                        n.isRead
                          ? "bg-zinc-900/40"
                          : "bg-blue-600/[0.07] hover:bg-blue-600/[0.12]"
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          n.isRead
                            ? "bg-zinc-800 text-zinc-500"
                            : "bg-blue-600/20 text-blue-400"
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-snug ${
                            n.isRead ? "text-zinc-400" : "text-zinc-100 font-medium"
                          }`}
                        >
                          {n.message || n.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          {formatTimestamp(n.createdAt)}
                          {!n.isRead && (
                            <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-blue-400 align-middle" />
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-900/80">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/requests");
                }}
                className="w-full text-center text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all activity
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

