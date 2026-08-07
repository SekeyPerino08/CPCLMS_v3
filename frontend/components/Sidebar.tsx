"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  BookOpenText,
  Users,
  ClipboardList,
  ScrollText,
  Shield,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Books",
    icon: BookOpen,
    children: [
      { href: "/books", label: "Physical Books", icon: BookOpen },
      { href: "/ebooks", label: "E-Books", icon: BookOpenText },
    ],
  },
  { href: "/members", label: "Members", icon: Users },
  { href: "/requests", label: "Borrow Requests", icon: ClipboardList },
  { href: "/activities", label: "Activity Logs", icon: ScrollText },
  { href: "/policies", label: "Policies", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    // Auto-open parent if a child route is active on first render
    const booksActive =
      pathname === "/books" ||
      pathname.startsWith("/books/") ||
      pathname === "/ebooks" ||
      pathname.startsWith("/ebooks/");
    return { Books: booksActive };
  });

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

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
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children;

          if (hasChildren) {
            const isOpen = !!openMenus[item.label];
            const childActive = item.children.some(
              (c: any) => pathname === c.href || pathname.startsWith(c.href + "/")
            );
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    childActive
                      ? "text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                  aria-expanded={isOpen}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="mt-1 mb-1 ml-4 pl-3 border-l border-zinc-800 space-y-0.5">
                    {item.children.map((child: any) => {
                      const ChildIcon = child.icon;
                      const isChildActive =
                        pathname === child.href ||
                        pathname.startsWith(child.href + "/");
                      return (
                        <Link
                          key={child.label}
                          href={child.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isChildActive
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                          }`}
                        >
                          <ChildIcon className="w-4 h-4" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
