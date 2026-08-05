"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  ScrollText,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/books", label: "Books", icon: BookOpen },
  { href: "/members", label: "Members", icon: Users },
  { href: "/requests", label: "Borrow Requests", icon: ClipboardList },
  { href: "/activities", label: "Activity Logs", icon: ScrollText },
  { href: "/policies", label: "Policies", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/60 sticky top-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/CPClogo.png" alt="Cordova Public College Logo" className="w-11 h-11 object-contain" />
        <div>
          <p className="font-bold text-white leading-tight">Cordova Public College</p>
          <p className="text-xs text-blue-300">Library Management System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-zinc-800">
        <p className="text-xs text-zinc-500">© 2026 Cordova Public College</p>
        <p className="text-xs text-zinc-600 mt-1">All rights reserved.</p>
      </div>
    </aside>
  );
}
