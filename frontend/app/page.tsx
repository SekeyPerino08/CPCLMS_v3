'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <span className="text-white font-bold text-2xl">CPC</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Smart Library Management System
            </h1>
            <p className="text-lg text-emerald-100 mb-8">
              Colegio de Porta Coeli — Modern library management with QR-based borrowing,
              reservation queues, and real-time analytics.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors shadow-lg"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-zinc-800 mb-12">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'QR-Based Borrowing',
                description: 'Generate and scan QR codes for fast, secure book checkouts and returns.',
                icon: '📱',
              },
              {
                title: 'Reservation Queue',
                description: 'Automatic queue management with notifications when books become available.',
                icon: '📋',
              },
              {
                title: 'Real-Time Analytics',
                description: 'Dashboard with statistics, trends, overdue tracking, and exportable reports.',
                icon: '📊',
              },
            ].map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border border-zinc-100 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-zinc-800 mb-2">{feature.title}</h3>
                <p className="text-zinc-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-zinc-900 text-zinc-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Colegio de Porta Coeli Library. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

