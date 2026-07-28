// ============================================================
// Bookmark Service — Resume Reading Support
// - localStorage-based bookmarks per e-book
// - Stores page number, total pages, and timestamp
// ============================================================

export interface BookmarkData {
  pageNumber: number;
  totalPages: number;
  timestamp: number;
}

const STORAGE_KEY_PREFIX = "bookmark:";

/**
 * Save a bookmark for a specific book
 */
export function saveBookmark(bookId: string, data: BookmarkData): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + bookId, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/**
 * Get the saved bookmark for a book, if any
 */
export function getBookmark(bookId: string): BookmarkData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + bookId);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Remove a bookmark for a book
 */
export function removeBookmark(bookId: string): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + bookId);
  } catch {
    // silently fail
  }
}

/**
 * Get all saved bookmarks (for "Continue Reading" list)
 */
export function getAllBookmarks(): { bookId: string; data: BookmarkData }[] {
  try {
    const bookmarks: { bookId: string; data: BookmarkData }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const bookId = key.slice(STORAGE_KEY_PREFIX.length);
        const data = getBookmark(bookId);
        if (data) {
          bookmarks.push({ bookId, data });
        }
      }
    }
    // Sort by most recently read
    bookmarks.sort((a, b) => b.data.timestamp - a.data.timestamp);
    return bookmarks;
  } catch {
    return [];
  }
}

/**
 * Get a human-readable "time ago" string from a timestamp
 */
export function timeAgo(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/**
 * Get reading progress percentage
 */
export function getProgress(data: BookmarkData): number {
  if (data.totalPages <= 0) return 0;
  return Math.round((data.pageNumber / data.totalPages) * 100);
}

