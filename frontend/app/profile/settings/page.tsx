"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "next-themes";
import {
  User,
  Palette,
  Shield,
  ChevronRight,
  ChevronDown,
  Bell,
  Lock,
  Globe,
  FileText,
  Image as ImageIcon,
  LogOut,
  Pencil,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Section = "account" | "appearance" | "policies";

const sections: {
  key: Section;
  label: string;
  icon: any;
  group: string;
}[] = [
  { key: "account", label: "Account", icon: User, group: "General" },
  { key: "appearance", label: "Appearance", icon: Palette, group: "General" },
  { key: "policies", label: "Policies", icon: Shield, group: "General" },
];

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className="w-full flex items-center gap-4 py-4 text-left group cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-500/10 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100">{title}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      {children || <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
        checked ? "bg-blue-600" : "bg-zinc-700"
      }`}
      aria-pressed={checked}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState<Section>("account");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  const initials =
    (user?.firstName?.charAt(0) || "U") +
    (user?.lastName?.charAt(0) || "");

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  const currentThemeLabel = themeOptions.find((o) => o.value === theme)?.label || "System";

  // Close theme dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Manage your account, preferences, and library policies
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left sidebar categories */}
              <aside className="lg:w-64 shrink-0">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                  <div className="px-4 py-5 border-b border-zinc-800">
                    <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                      Settings
                    </p>
                  </div>
                  <nav className="p-2">
                    {["General"].map((group) => (
                      <div key={group}>
                        <p className="px-3 pt-3 pb-1.5 text-xs uppercase tracking-wider text-zinc-600 font-medium">
                          {group}
                        </p>
                        {sections
                          .filter((s) => s.group === group)
                          .map((s) => {
                            const Icon = s.icon;
                            const isActive = active === s.key;
                            return (
                              <button
                                key={s.key}
                                onClick={() => setActive(s.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                                  isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {s.label}
                              </button>
                            );
                          })}
                      </div>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                {active === "account" && (
                  <div className="space-y-6">
                    {/* Account header */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-600/30 shrink-0">
                          {initials.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-white">
                            {user?.firstName} {user?.lastName}
                          </h2>
                          <p className="text-sm text-zinc-400 mt-0.5">
                            {user?.email || "No email on file"}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-colors self-start sm:self-center"
                        >
                          <Pencil className="w-4 h-4" />
                          Manage
                        </Link>
                      </div>
                    </div>

                    {/* Account settings rows */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                      <div className="px-6 py-5 border-b border-zinc-800">
                        <h3 className="text-base font-semibold text-white">
                          Account
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Manage your account settings
                        </p>
                      </div>
                      <div className="px-6 divide-y divide-zinc-800/60">
                        <SettingRow
                          icon={User}
                          title="Profile Information"
                          description="Update your name, contact details, and department"
                          onClick={() => router.push("/profile")}
                        />
                        <SettingRow
                          icon={Lock}
                          title="Change Password"
                          description="Update your password to keep your account secure"
                          onClick={() => {}}
                        >
                          <button className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 hover:text-white transition-colors shrink-0">
                            Change
                          </button>
                        </SettingRow>
                        <SettingRow
                          icon={Globe}
                          title="Language & Region"
                          description="Set your preferred language and region settings"
                          onClick={() => {}}
                        >
                          <span className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium shrink-0">
                            English (PH)
                          </span>
                        </SettingRow>
                        <SettingRow
                          icon={Bell}
                          title="Email Notifications"
                          description="Receive notifications about due dates and new books"
                          onClick={() => setEmailNotif((v) => !v)}
                        >
                          <Toggle checked={emailNotif} onChange={setEmailNotif} />
                        </SettingRow>
                        <SettingRow
                          icon={Bell}
                          title="Push Notifications"
                          description="Get real-time alerts for borrow and reservation updates"
                        >
                          <Toggle checked={pushNotif} onChange={setPushNotif} />
                        </SettingRow>
                        <SettingRow
                          icon={LogOut}
                          title="Log Out"
                          description="Sign out of your library account"
                          onClick={handleLogout}
                        >
                          <span className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/30 shrink-0">
                            Sign out
                          </span>
                        </SettingRow>
                      </div>
                    </div>
                  </div>
                )}

                {active === "appearance" && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                    <div className="px-6 py-5 border-b border-zinc-800">
                      <h3 className="text-base font-semibold text-white">
                        Appearance
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Customize how the system looks
                      </p>
                    </div>
                    <div className="px-6 divide-y divide-zinc-800/60">
<div className="flex items-center gap-4 py-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
                          <Palette className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-100">Theme</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Choose your preferred color theme
                          </p>
                        </div>
                        <div className="relative shrink-0" ref={themeRef}>
                          <button
                            onClick={() => setThemeOpen((o) => !o)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-medium ring-1 ring-blue-500/30 hover:bg-blue-500/25 transition-colors"
                            aria-haspopup="listbox"
                            aria-expanded={themeOpen}
                          >
                            {currentThemeLabel}
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {themeOpen && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setThemeOpen(false)} />
                              <div className="absolute right-0 mt-2 w-40 z-40 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden p-1.5">
                                {themeOptions.map((opt) => {
                                  const isActive = theme === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      onClick={() => {
                                        setTheme(opt.value as any);
                                        setThemeOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
                                        isActive
                                          ? "bg-blue-600 text-white"
                                          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                      }`}
                                      role="option"
                                      aria-selected={isActive}
                                    >
                                      {opt.label}
                                      {isActive && <Check className="w-4 h-4" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <SettingRow
                        icon={ImageIcon}
                        title="Accent Color"
                        description="Set the accent color for buttons and highlights"
                        onClick={() => {}}
                      >
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-5 h-5 rounded-full bg-blue-500 ring-2 ring-blue-500/30" />
                          <span className="w-5 h-5 rounded-full bg-violet-500" />
                          <span className="w-5 h-5 rounded-full bg-emerald-500" />
                        </div>
                      </SettingRow>
                      <SettingRow
                        icon={FileText}
                        title="Font Size"
                        description="Adjust the text size throughout the system"
                        onClick={() => {}}
                      >
                        <span className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium shrink-0">
                          Medium
                        </span>
                      </SettingRow>
                    </div>
                  </div>
                )}

                {active === "policies" && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                    <div className="px-6 py-5 border-b border-zinc-800">
                      <h3 className="text-base font-semibold text-white">
                        Policies
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        View and manage library rules and guidelines
                      </p>
                    </div>
                    <div className="px-6 py-8 flex flex-col items-center justify-center text-center">
                      <Shield className="w-12 h-12 text-zinc-600 mb-4" />
                      <p className="text-zinc-300 font-medium">
                        Library Policies
                      </p>
                      <p className="text-sm text-zinc-500 mt-1">
                        Manage borrowing rules, fines, and general settings
                      </p>
                      <Link
                        href="/policies"
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-colors"
                      >
                        Go to Policies
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
