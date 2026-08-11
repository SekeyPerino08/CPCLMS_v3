// ============================================================
// API Client Utility
// - Handles JWT tokens (localStorage fallback)
// - Provides typed request/response methods
// ============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  rateLimited?: boolean;
  retryAfterMs?: number;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

class ApiClient {
  private baseUrl: string;

  // In-flight request deduplication map (keyed by method + endpoint + body)
  private inflight = new Map<string, Promise<ApiResponse<any>>>();
  // Short-lived deduplication for rapid repeated actions such as double-clicks
  private recentRequests = new Map<string, number>();
  // Client-side rate-limit cooldown: timestamp until which requests are suppressed
  private rateLimitUntil = 0;
  // How long to suppress requests after receiving a 429 (ms)
  private static readonly RATE_LIMIT_COOLDOWN_MS = 10000;
  // How long to suppress identical actions after an initial submit
  private static readonly DEDUP_WINDOW_MS = 1600;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Client-side cooldown: if we recently received a 429, short-circuit
    // so we don't keep hammering the server and trigger the limiter again.
    const remainingCooldown = this.rateLimitUntil - Date.now();
    if (remainingCooldown > 0) {
      return {
        success: false,
        error: 'Too many requests, please try again later.',
        rateLimited: true,
        retryAfterMs: remainingCooldown,
      } as ApiResponse<T>;
    }

    const method = options.method || 'GET';
    const body = options.body ? String(options.body) : '';
    // Deduplicate identical concurrent requests so we never fire the same
    // GET/POST more than once at a time (keyed by method + endpoint + body).
    const cacheKey = `${method}:${endpoint}:${body}`;
    if (this.inflight.has(cacheKey)) {
      return this.inflight.get(cacheKey) as Promise<ApiResponse<T>>;
    }

    if (!['GET', 'HEAD'].includes(method.toUpperCase())) {
      const now = Date.now();
      const lastAttempt = this.recentRequests.get(cacheKey);
      if (lastAttempt && now - lastAttempt < ApiClient.DEDUP_WINDOW_MS) {
        return {
          success: false,
          error: 'Please wait a moment before trying that again.',
          rateLimited: true,
          retryAfterMs: ApiClient.DEDUP_WINDOW_MS - (now - lastAttempt),
        } as ApiResponse<T>;
      }
      this.recentRequests.set(cacheKey, now);
      setTimeout(() => this.recentRequests.delete(cacheKey), ApiClient.DEDUP_WINDOW_MS);
    }

    const promise = this.doFetch<T>(endpoint, options, headers, cacheKey);
    this.inflight.set(cacheKey, promise);
    return promise;
  }

  private async doFetch<T>(
    endpoint: string,
    options: RequestInit,
    headers: Record<string, string>,
    cacheKey: string
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // 429 — rate limited. Record a cooldown so the UI can show a message
      // and we suppress repeated identical calls for a short window.
      if (response.status === 429) {
        this.rateLimitUntil = Date.now() + ApiClient.RATE_LIMIT_COOLDOWN_MS;
        let data: ApiResponse<T>;
        try {
          data = await response.json();
        } catch {
          data = {} as ApiResponse<T>;
        }
        return {
          ...data,
          success: false,
          rateLimited: true,
          retryAfterMs: ApiClient.RATE_LIMIT_COOLDOWN_MS,
          error: data.error || 'Too many requests. Please wait a moment and try again.',
        } as ApiResponse<T>;
      }

      let data: ApiResponse<T>;
      try {
        data = await response.json();
      } catch {
        data = { success: false, error: 'Unexpected server response' } as ApiResponse<T>;
      }

      // If unauthorized, try refresh token
      if (response.status === 401 && this.getRefreshToken()) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.getToken()}`;
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
          });
          try {
            return await retryResponse.json();
          } catch {
            return { success: false, error: 'Unexpected server response' } as ApiResponse<T>;
          }
        }
        // Refresh failed
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      return data;
    } finally {
      this.inflight.delete(cacheKey);
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async login(identifier: string, password: string): Promise<ApiResponse<{ user: any; accessToken: string; refreshToken: string }>> {
    const response = await this.request<{ user: any; accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      }
    );

    if (response.success && response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

async register(data: {
    firstName: string;
    lastName: string;
    libraryId: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
    yearSection?: string;
    phone?: string;
  }): Promise<ApiResponse<any>> {
const response = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Do NOT store tokens after registration. The user must log in
    // manually with their new credentials on the login page.
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors
    }
    this.clearTokens();
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth-specific endpoints
  async getMe(): Promise<ApiResponse<any>> {
    return this.get('/auth/me');
  }

  async updateMe(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return this.put('/auth/me', body);
  }

  // Books
  async getBooks(params?: Record<string, string>): Promise<ApiResponse<any[]>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/books${query}`);
  }

  async getBook(id: string): Promise<ApiResponse<any>> {
    return this.get(`/books/${id}`);
  }

  // Transactions
  async getTransactions(params?: Record<string, string>): Promise<ApiResponse<any[]>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/transactions${query}`);
  }

async createBorrowRequest(data: {
    bookIds: string[];
    notes?: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/transactions/requests', { bookIds: data.bookIds, notes: data.notes });
  }

  async getBorrowRequests(params?: Record<string, string>): Promise<ApiResponse<any[]>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/transactions/requests${query}`);
  }

  async getBorrowRequest(id: string): Promise<ApiResponse<any>> {
    return this.get(`/transactions/requests/${id}`);
  }

  async approveRequest(id: string): Promise<ApiResponse<any>> {
    return this.put(`/transactions/requests/${id}/approve`);
  }

  // Generate a unique QR code for a pending borrow request (librarian).
  async generateRequestQR(id: string): Promise<ApiResponse<any>> {
    return this.get(`/transactions/requests/${id}/qr`);
  }

  // Confirm approval after the borrower scans the QR on their phone.
  async approveByQRCode(requestId: string, token: string): Promise<ApiResponse<any>> {
    return this.post('/transactions/requests/approve-qr', { requestId, token });
  }

  async rejectRequest(id: string, reason: string): Promise<ApiResponse<any>> {
    return this.put(`/transactions/requests/${id}/reject`, { reason });
  }

async returnBook(id: string, qrCode?: string): Promise<ApiResponse<any>> {
    return this.put(`/transactions/${id}/return`, { qrCode });
  }

  async declareMissing(id: string, reason?: string): Promise<ApiResponse<any>> {
    return this.put(`/transactions/${id}/missing`, { reason });
  }

async payFine(id: string, amount: number): Promise<ApiResponse<any>> {
    return this.put(`/transactions/${id}/pay-fine`, { amount });
  }

  // Notifications
  async getNotifications(params?: Record<string, string>): Promise<ApiResponse<any>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/notifications${query}`);
  }

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    return this.get('/notifications/unread-count');
  }

  async markNotificationRead(id: string): Promise<ApiResponse<any>> {
    return this.put(`/notifications/${id}/read`);
  }

  async markAllNotificationsRead(): Promise<ApiResponse<any>> {
    return this.put('/notifications/mark-all-read');
  }

// Analytics
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.get('/analytics/dashboard');
  }

  async getMyDashboardStats(): Promise<ApiResponse<any>> {
    return this.get('/analytics/my-dashboard');
  }

  async getMonthlyTrends(months?: number): Promise<ApiResponse<any>> {
    return this.get(`/analytics/monthly-trends?months=${months || 6}`);
  }

  // Policies
  async getPolicies(): Promise<ApiResponse<any[]>> {
    return this.get('/policies');
  }

  async updatePolicy(key: string, value: string, description?: string): Promise<ApiResponse<any>> {
    return this.put('/policies', { key, value, description });
  }

  // Activity Logs
  async getActivities(params?: Record<string, string>): Promise<ApiResponse<any[]>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/activities${query}`);
  }

  // Categories
  async getCategories(): Promise<ApiResponse<any[]>> {
    return this.get('/categories');
  }

  // EBooks
  async getEBooks(params?: Record<string, string>): Promise<ApiResponse<any[]>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/ebooks${query}`);
  }

  // Reports
  getReportUrl(type: string, format: 'pdf' | 'xlsx' = 'pdf'): string {
    const token = this.getToken();
    return `${this.baseUrl}/reports/${type}?format=${format}&token=${token}`;
  }
}

export const api = new ApiClient(API_BASE_URL);

export default api;

