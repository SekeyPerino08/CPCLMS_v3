'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const { register, isAuthenticated, loading } = useAuth();
  const router = useRouter();
const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    libraryId: '',
    email: '',
    phone: '',
    department: '',
    yearSection: '',
    role: 'STUDENT',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/student/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    try {
const result = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        libraryId: formData.libraryId.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        department: formData.department,
        yearSection: formData.yearSection.trim(),
        role: formData.role,
        password: formData.password,
      });

if (result.success) {
        // Account created — do not auto-login. Redirect to login so the
        // user can sign in with their new credentials.
        router.push('/login');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass =
    'w-full pl-10 pr-3 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-6">
{/* ── Left Card: Dark branding (identical to Login) ─────── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-blue-950 to-blue-900 text-white p-10 sm:p-12 flex flex-col justify-between shadow-[0_20px_60px_-15px_rgba(37,99,235,0.5)] ring-1 ring-white/10 min-h-[560px]">
            {/* Decorative glow */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl" />
            <div className="absolute top-1/3 right-8 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl" />
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />

            {/* Logo + Institution + Heading */}
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/CPClogo.png" alt="Cordova Public College Logo" className="w-12 h-12 object-contain shrink-0" />
                <div>
                  <p className="font-bold text-lg leading-tight text-white">Cordova Public College</p>
                  <p className="text-blue-200 text-sm">Library Management System</p>
                </div>
              </div>

              {/* Heading + Subtitle */}
              <div className="max-w-md">
                <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-white mb-4">
                  Welcome to <span className="text-blue-300">Knowledge</span>
                </h1>
                <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
                  Sign in to manage books, track borrows, and keep your academic resources organized.
                </p>
              </div>
            </div>

            {/* Feature pills */}
            <div className="relative z-10 flex flex-col gap-3 max-w-md">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-full px-5 py-3 shadow-lg shadow-black/10">
                <div className="w-8 h-8 bg-blue-400/30 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <span className="text-sm text-blue-50">Secure access with modern authentication UI</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md ring-1 ring-white/15 rounded-full px-5 py-3 shadow-lg shadow-black/10">
                <div className="w-8 h-8 bg-blue-400/30 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-sm text-blue-50">Minimal, professional design consistent with dashboards</span>
              </div>
            </div>
          </div>

          {/* ── Right Card: Registration Form ───────────────────── */}
          <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-10 sm:p-12 flex flex-col justify-center shadow-2xl shadow-black/40 min-h-[560px]">
            <div className="w-full max-w-md mx-auto">
{/* Logo */}
              <div className="flex flex-col items-center mb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/CPClogo.png" alt="Cordova Public College Logo" className="w-20 h-20 object-contain mb-4" />
                <h2 className="text-3xl font-bold text-white">Create Account</h2>
                <p className="text-zinc-400 mt-2">Join the Library System to get started.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    {error}
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-3 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="First"
                      />
                    </div>
                    <div className="relative">
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-3 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Last"
                      />
                    </div>
                  </div>
                </div>

                {/* ID Number */}
                <div>
                  <label htmlFor="libraryId" className="block text-sm font-medium text-zinc-300 mb-1.5">
                    ID Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
<input
                      id="libraryId"
                      name="libraryId"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={formData.libraryId}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                        setFormData((prev) => ({ ...prev, libraryId: digitsOnly }));
                      }}
                      className={inputClass}
                      placeholder="Enter your ID Number (e.g., 2025-01234)"
                    />
                  </div>
                </div>

{/* Email + Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Contact Information
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Email"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h.5a2 2 0 011.856 1.257l.994 2.486a2 2 0 01-.288 2.13l-.9 1.125a.5.5 0 01-.12.144A12.05 12.05 0 0014.88 16.96a.5.5 0 00.144-.12l1.125-.9a2 2 0 012.13-.288l2.486.994A2 2 0 0122 18.5v.5a2 2 0 01-2 2H19a16 16 0 01-16-16V5z" />
                        </svg>
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        inputMode="tel"
                        pattern="[0-9]*"
                        value={formData.phone}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                          setFormData((prev) => ({ ...prev, phone: digitsOnly }));
                        }}
                        className={inputClass}
                        placeholder="Phone"
                      />
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                    >
                      <option value="" className="bg-zinc-900 text-white">Select Department</option>
                      <option value="BSIT" className="bg-zinc-900 text-white">Bachelor of Science in Information Technology (BSIT)</option>
                      <option value="BSHM" className="bg-zinc-900 text-white">Bachelor of Science in Hospitality Management (BSHM)</option>
                      <option value="BEED" className="bg-zinc-900 text-white">Bachelor of Elementary Education (BEED)</option>
                      <option value="BSED" className="bg-zinc-900 text-white">Bachelor of Secondary Education (BSED)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

{/* Year & Section + Role */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Academic Details
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="yearSection"
                        name="yearSection"
                        type="text"
                        value={formData.yearSection}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Year &amp; Section"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <select
                        id="role"
                        name="role"
                        required
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                      >
                        <option value="STUDENT" className="bg-zinc-900 text-white">Student</option>
                        <option value="FACULTY" className="bg-zinc-900 text-white">Faculty</option>
                        <option value="LIBRARIAN" className="bg-zinc-900 text-white">Librarian</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-14 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-200 transition"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-14 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Repeat password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-200 transition"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Register button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
                >
                  {submitting ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              {/* Back to login */}
              <div className="mt-6 text-center">
                <p className="text-sm text-zinc-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
                    Back to Login
                  </Link>
                </p>
              </div>

              {/* Terms footer */}
              <p className="text-center text-xs text-zinc-500 mt-6">
                By creating an account, you agree to the Library System terms.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright footer */}
      <div className="pb-6 text-center">
        <p className="text-xs text-zinc-600">
          © 2026 Cordova Public College. All rights reserved.
        </p>
      </div>
    </div>
  );
}
