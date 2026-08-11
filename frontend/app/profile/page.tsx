"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Lock,
  Bell,
  Palette,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  IdCard,
  User as UserIcon,
  Check,
  Camera,
} from "lucide-react";

const roleLabel = (role?: string) => {
  if (role === "LIBRARIAN") return "Librarian";
  if (role === "FACULTY") return "Faculty";
  return "Student";
};

const roleBadge = (role?: string) => {
  if (role === "LIBRARIAN")
    return "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30";
  if (role === "FACULTY")
    return "bg-violet-500/15 text-violet-400 ring-violet-500/30";
  return "bg-blue-500/15 text-blue-400 ring-blue-500/30";
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-sm font-medium text-zinc-100 truncate">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    libraryId: "",
    phone: "",
    department: "",
    yearSection: "",
  });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;

    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      libraryId: user.libraryId || "",
      phone: user.phone || "",
      department: user.department || "",
      yearSection: user.yearSection || "",
    });
    setAvatarPreview(user.avatar || null);
    setAvatarDataUrl(null);
    setSaveError(null);
  }, [user]);

  const initials =
    (user?.firstName?.charAt(0) || "U") +
    (user?.lastName?.charAt(0) || "");

  const role = user?.role || "STUDENT";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
              <p className="text-sm text-zinc-400 mt-1">
                View and manage your account information
              </p>
            </div>

            {/* Profile Header Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-600/30 shrink-0">
                  {editing ? (
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors"
                      aria-label="Upload profile image"
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Profile avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {initials.toUpperCase()}
                        </span>
                      )}
                    </button>
                  ) : (
                    avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {initials.toUpperCase()}
                        </span>
                      </div>
                    )
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!['image/jpeg', 'image/png'].includes(file.type)) {
                        setSaveError('Only JPG and PNG images are supported.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = reader.result as string;
                        setAvatarPreview(result);
                        setAvatarDataUrl(result);
                        setSaveError(null);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {editing ? (
                    <div className="absolute bottom-1 right-1 rounded-full bg-zinc-950/80 p-2 text-white shadow-md">
                      <Camera className="w-4 h-4" />
                    </div>
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-3">
                    <h2 className="text-xl font-bold text-white">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${roleBadge(role)}`}
                    >
                      {roleLabel(role)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5" />
                    {user?.libraryId || "N/A"}
                  </p>
                  <p className="text-sm text-zinc-400 mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {user?.email || "N/A"}
                  </p>
                </div>
                {editing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!formData.firstName.trim() || !formData.lastName.trim()) {
                          setSaveError('Full name is required.');
                          return;
                        }
                        setSaving(true);
                        setSaveError(null);

                        const payload: Record<string, unknown> = {
                          firstName: formData.firstName.trim(),
                          lastName: formData.lastName.trim(),
                          libraryId: formData.libraryId.trim(),
                          email: formData.email.trim(),
                          phone: formData.phone.trim() || undefined,
                          department: formData.department.trim() || undefined,
                          yearSection: formData.yearSection.trim() || undefined,
                        };

                        if (avatarDataUrl !== null) {
                          payload.avatar = avatarDataUrl || undefined;
                        }

                        const response = await api.updateMe(payload);
                        if (response.success) {
                          await refreshUser();
                          setEditing(false);
                          setAvatarDataUrl(null);
                        } else {
                          setSaveError(response.error || 'Unable to save profile.');
                        }
                        setSaving(false);
                      }}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-colors self-start sm:self-center"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setSaveError(null);
                        if (user) {
                          setFormData({
                            firstName: user.firstName || "",
                            lastName: user.lastName || "",
                            email: user.email || "",
                            libraryId: user.libraryId || "",
                            phone: user.phone || "",
                            department: user.department || "",
                            yearSection: user.yearSection || "",
                          });
                          setAvatarPreview(user.avatar || null);
                          setAvatarDataUrl(null);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-black/20 transition-colors self-start sm:self-center"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-colors self-start sm:self-center"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-800">
                  <h3 className="text-base font-semibold text-white">
                    Personal Information
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Your account details
                  </p>
                </div>
                <div className="px-6 py-2 divide-y divide-zinc-800/60">
                  {editing ? (
                    <div className="space-y-4 py-3">
                      <div>
                        <p className="text-xs text-zinc-500">Full Name</p>
                        <Input
                          value={`${formData.firstName} ${formData.lastName}`.trim()}
                          onChange={(event) => {
                            const value = event.target.value;
                            const parts = value.trim().split(/\s+/);
                            setFormData((prev) => ({
                              ...prev,
                              firstName: parts[0] || "",
                              lastName: parts.slice(1).join(" "),
                            }));
                          }}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">ID Number</p>
                        <Input
                          value={formData.libraryId}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, libraryId: event.target.value }))
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Email</p>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, email: event.target.value }))
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Phone Number</p>
                        <Input
                          value={formData.phone}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, phone: event.target.value }))
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Department</p>
                        <Input
                          value={formData.department}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, department: event.target.value }))
                          }
                          className="mt-2"
                        />
                      </div>
                      {role === "STUDENT" && (
                        <div>
                          <p className="text-xs text-zinc-500">Year & Section</p>
                          <Input
                            value={formData.yearSection}
                            onChange={(event) =>
                              setFormData((prev) => ({ ...prev, yearSection: event.target.value }))
                            }
                            className="mt-2"
                          />
                        </div>
                      )}
                      {saveError ? (
                        <p className="text-sm text-rose-400">{saveError}</p>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <InfoRow
                        icon={UserIcon}
                        label="Full Name"
                        value={`${user?.firstName} ${user?.lastName}`}
                      />
                      <InfoRow icon={IdCard} label="ID Number" value={user?.libraryId} />
                      <InfoRow icon={Mail} label="Email" value={user?.email} />
                      <InfoRow icon={Phone} label="Phone Number" value={user?.phone} />
                      <InfoRow
                        icon={Building2}
                        label="Department"
                        value={user?.department}
                      />
                      {role === "STUDENT" && (
                        <InfoRow
                          icon={GraduationCap}
                          label="Year & Section"
                          value={user?.yearSection}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Account Settings */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-800">
                  <h3 className="text-base font-semibold text-white">
                    Account Settings
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Security and preferences
                  </p>
                </div>

                <div className="px-6 py-2 divide-y divide-zinc-800/60">
                  {/* Change Password */}
                  <button className="w-full flex items-center gap-3 py-3.5 text-left group">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-500/10 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100">
                        Change Password
                      </p>
                      <p className="text-xs text-zinc-500">
                        Update your password to keep your account secure
                      </p>
                    </div>
                    <ChevronIcon />
                  </button>

{/* Notification Preferences */}
                  <div
                    onClick={() => setNotifications((n) => !n)}
                    className="w-full flex items-center gap-3 py-3.5 text-left group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-500/10 transition-colors">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100">
                        Notification Preferences
                      </p>
                      <p className="text-xs text-zinc-500">
                        Borrow due alerts and updates
                      </p>
                    </div>
                    <Toggle checked={notifications} onChange={setNotifications} />
                  </div>

                  {/* Theme Preference */}
                  <div className="flex items-center gap-3 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100">
                        Theme Preference
                      </p>
                      <p className="text-xs text-zinc-500">Dark mode (default)</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30">
                      <Check className="w-3 h-3" />
                      Dark
                    </span>
                  </div>

                  {/* Account Status */}
                  <div className="flex items-center gap-3 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100">
                        Account Status
                      </p>
                      <p className="text-xs text-zinc-500">
                        Your account is active and in good standing
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="w-4 h-4 text-zinc-500 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
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
      onClick={() => onChange(!checked)}
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
