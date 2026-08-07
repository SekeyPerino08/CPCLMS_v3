'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
const { login, user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const target = user?.role === 'LIBRARIAN' ? '/dashboard' : '/student/dashboard';
      router.replace(target);
    }
  }, [loading, isAuthenticated, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await login(identifier.trim(), password);
      if (result.success) {
        const target = result.user?.role === 'LIBRARIAN' ? '/dashboard' : '/student/dashboard';
        router.push(target);
      } else {
        setError(result.error || 'Invalid ID Number or password');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestLogin = () => {
    router.push('/books?guest=1');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-6">
{/* ── Left Card: Dark branding ─────────────────────────── */}
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

          {/* ── Right Card: Login Form ──────────────────────────── */}
          <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-10 sm:p-12 flex flex-col justify-center shadow-2xl shadow-black/40 min-h-[560px]">
            <div className="w-full max-w-md mx-auto">
{/* Logo */}
              <div className="flex flex-col items-center mb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/CPClogo.png" alt="Cordova Public College Logo" className="w-20 h-20 object-contain mb-4" />
                <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                <p className="text-zinc-400 mt-2">Sign in to the Library System to continue.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    {error}
                  </div>
                )}

                {/* ID Number */}
                <div>
                  <label htmlFor="identifier" className="block text-sm font-medium text-zinc-300 mb-1.5">
                    ID Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
<input
                      id="identifier"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full pl-10 pr-3 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Enter your ID Number (e.g., 2025-01234)"
                    />
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
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-14 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Enter your password"
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

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-950 accent-blue-600"
                    />
                    <span className="text-sm text-zinc-400">Remember me</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot Password?
                  </Link>
                </div>

{/* Login button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
                >
                  {submitting ? 'Signing in...' : 'Login'}
                </button>

                {/* Guest login */}
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="w-full py-3 bg-zinc-800 text-zinc-200 font-medium rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700"
                >
                  Login as Guest
                </button>
              </form>

              {/* Register link */}
              <div className="mt-5">
                <Link
                  href="/register"
                  className="w-full py-3 bg-blue-600/10 text-blue-400 font-medium rounded-xl hover:bg-blue-600/20 transition-colors border border-blue-600/30 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Account
                </Link>
              </div>

{/* Terms footer */}
              <p className="text-center text-xs text-zinc-500 mt-6">
                By continuing, you agree to the Library System terms.
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
