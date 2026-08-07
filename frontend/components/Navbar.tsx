'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

const navLinks = [
    { href: '/dashboard', label: 'Dashboard', roles: ['LIBRARIAN'] },
    { href: '/student/dashboard', label: 'Dashboard', roles: ['FACULTY', 'STUDENT'] },
    { href: '/books', label: 'Books', roles: ['LIBRARIAN', 'FACULTY', 'STUDENT'] },
{ href: '/ebooks', label: 'E-Books', roles: ['LIBRARIAN', 'FACULTY', 'STUDENT'] },
    { href: '/requests', label: 'Requests', roles: ['LIBRARIAN', 'FACULTY', 'STUDENT'] },
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
<Link href={user?.role === 'LIBRARIAN' ? '/dashboard' : '/student/dashboard'} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden ring-1 ring-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/CPClogo.png" alt="Cordova Public College Logo" className="w-7 h-7 object-contain" />
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

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              Sign out
            </button>
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

