// ============================================================
// Auth Utilities
// ============================================================

export interface User {
  id: string;
  libraryId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'STUDENT' | 'FACULTY' | 'LIBRARIAN';
  department: string | null;
  yearSection: string | null;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

export function hasRole(...roles: string[]): boolean {
  const user = getUser();
  if (!user) return false;
  return roles.includes(user.role);
}

export function isLibrarian(): boolean {
  return hasRole('LIBRARIAN');
}

export function isFaculty(): boolean {
  return hasRole('FACULTY');
}

export function isStudent(): boolean {
  return hasRole('STUDENT');
}

export function canBorrow(): boolean {
  return isAuthenticated() && (isStudent() || isFaculty() || isLibrarian());
}

export function getFullName(user?: User | null): string {
  if (!user) return '';
  return `${user.firstName} ${user.lastName}`;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    STUDENT: 'Student',
    FACULTY: 'Faculty',
    LIBRARIAN: 'Librarian',
  };
  return labels[role] || role;
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    STUDENT: 'bg-blue-100 text-blue-800',
    FACULTY: 'bg-purple-100 text-purple-800',
    LIBRARIAN: 'bg-emerald-100 text-emerald-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

