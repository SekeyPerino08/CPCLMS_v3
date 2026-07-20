import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-700 border-blue-200",
    RETURNED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    OVERDUE: "bg-red-100 text-red-700 border-red-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
    CANCELLED: "bg-zinc-100 text-zinc-700 border-zinc-200",
    AVAILABLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    BORROWED: "bg-blue-100 text-blue-700 border-blue-200",
    RESERVED: "bg-amber-100 text-amber-700 border-amber-200",
    MAINTENANCE: "bg-red-100 text-red-700 border-red-200",
    LOST: "bg-zinc-100 text-zinc-700 border-zinc-200",
  };
  return colors[status] || "bg-zinc-100 text-zinc-700 border-zinc-200";
}

export function getInitials(firstName?: string, lastName?: string): string {
  return `${(firstName || "")?.charAt(0)}${(lastName || "")?.charAt(0)}`;
}
