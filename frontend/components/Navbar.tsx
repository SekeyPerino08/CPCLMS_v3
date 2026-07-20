'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getFullName, getRoleLabel, getRoleColor } from '@/lib/auth';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', roles: ['LIBRARIAN', 'FACULTY', 'STUDENT'] },
    { href: '/books', label: 'Books', roles: ['LIBRARIAN', 'FACULTY', 'STUDENT'] },
    { href: '/ebooks', label: 'E-Books', roles: ['LIBRARIAN', 'FACULTY', 'STUDENT'] },
    { href: '/transactions', label: 'Transactions', roles: ['LIBRARIAN', 'FACULTY', 'STUDENT'] },
    { href: '/requests', label: 'Requests', roles: ['LIBRARIAN', 'FACULTY', 'STUDENT'] },
    { href: '/reservations', label: 'Reservations', roles: ['LIBRARIAN', 'FACULTY', 'STUDENT'] },
    { href: '/activities', label: 'Activity Log', roles: ['LIBRARIAN'] },
    { href: '/policies', label: 'Policies', roles: ['LIBRARIAN'] },
    { href: '/reports', label: 'Reports', roles: ['LIBRARIAN'] },
  ];

  const visibleLinks = navLinks.filter(
    (link) => user && link.roles.includes(user.role)
  );

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-white border-b border-zinc-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CPC</span>
              </div>
              <span className="font-semibold text-zinc-800 hidden sm:block">Library</span>
            </Link>

            {/* Desktop nav */}
            <div className="ml-10 hidden md:flex items-center space-x-1">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-md text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-semibold text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-zinc-800">{user && getFullName(user)}</p>
                  <p className="text-xs text-zinc-500">{user?.libraryId}</p>
                </div>
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-zinc-200 z-20 py-1">
                    <div className="px-4 py-3 border-b border-zinc-100">
                      <p className="text-sm font-medium text-zinc-800">{user && getFullName(user)}</p>
                      <p className="text-xs text-zinc-500">{user?.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${user ? getRoleColor(user.role) : ''}`}>
                        {user && getRoleLabel(user.role)}
                      </span>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  pathname.startsWith(link.href)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

