/**
 * API Client - Frontend HTTP client for backend communication
 *
 * Similar to Lovable's Supabase client pattern.
 * Provides type-safe API calls with automatic authentication.
 */

// ========================================
// TYPES
// ========================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface User {
    id: string;
    email: string;
    username: string | null;
    displayName: string;
    avatarUrl: string | null;
    theme?: 'light' | 'dark' | 'system';
    preferences?: Record<string, unknown>;
    createdAt?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface Item {
    id: string;
    userId: string;
    title: string;
    description: string | null;
    status: 'draft' | 'active' | 'archived';
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface ListItemsParams {
    status?: 'draft' | 'active' | 'archived';
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}

// ========================================
// API CLIENT CLASS
// ========================================

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
        // Load token from localStorage on init
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('auth_token');
        }
    }

    /**
     * Set authentication token
     */
    setToken(token: string | null): void {
        this.token = token;
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem('auth_token', token);
            } else {
                localStorage.removeItem('auth_token');
            }
        }
    }

    /**
     * Get current token
     */
    getToken(): string | null {
        return this.token;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.token;
    }

    /**
     * Make HTTP request
     */
    private async request<T>(
        method: string,
        path: string,
        body?: unknown
    ): Promise<ApiResponse<T>> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            const data = await response.json();
            return data as ApiResponse<T>;
        } catch (error) {
            console.error(`API request failed: ${method} ${path}`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Request failed',
            };
        }
    }

    // ----------------------------------------
    // AUTH METHODS
    // ----------------------------------------

    /**
     * Register a new user
     */
    async register(
        email: string,
        password: string,
        displayName?: string,
        username?: string
    ): Promise<ApiResponse<AuthResponse>> {
        const response = await this.request<AuthResponse>('POST', '/api/auth/register', {
            email,
            password,
            displayName,
            username,
        });

        if (response.success && response.data) {
            this.setToken(response.data.token);
        }

        return response;
    }

    /**
     * Login with email/password
     */
    async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
        const response = await this.request<AuthResponse>('POST', '/api/auth/login', {
            email,
            password,
        });

        if (response.success && response.data) {
            this.setToken(response.data.token);
        }

        return response;
    }

    /**
     * Logout current session
     */
    async logout(): Promise<ApiResponse<void>> {
        const response = await this.request<void>('POST', '/api/auth/logout');
        this.setToken(null);
        return response;
    }

    /**
     * Logout all sessions
     */
    async logoutAll(): Promise<ApiResponse<void>> {
        const response = await this.request<void>('POST', '/api/auth/logout-all');
        this.setToken(null);
        return response;
    }

    /**
     * Get current user
     */
    async getCurrentUser(): Promise<ApiResponse<User>> {
        return this.request<User>('GET', '/api/auth/me');
    }

    /**
     * Update current user profile
     */
    async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
        return this.request<User>('PUT', '/api/auth/me', data);
    }

    // ----------------------------------------
    // ITEMS METHODS
    // ----------------------------------------

    /**
     * List items
     */
    async listItems(params: ListItemsParams = {}): Promise<ApiResponse<Item[]>> {
        const searchParams = new URLSearchParams();
        if (params.status) searchParams.set('status', params.status);
        if (params.search) searchParams.set('search', params.search);
        if (params.sortBy) searchParams.set('sortBy', params.sortBy);
        if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
        if (params.limit) searchParams.set('limit', params.limit.toString());
        if (params.offset) searchParams.set('offset', params.offset.toString());

        const query = searchParams.toString();
        return this.request<Item[]>('GET', `/api/items${query ? `?${query}` : ''}`);
    }

    /**
     * Get single item
     */
    async getItem(id: string): Promise<ApiResponse<Item>> {
        return this.request<Item>('GET', `/api/items/${id}`);
    }

    /**
     * Create item
     */
    async createItem(data: {
        title: string;
        description?: string;
        status?: 'draft' | 'active' | 'archived';
        metadata?: Record<string, unknown>;
    }): Promise<ApiResponse<Item>> {
        return this.request<Item>('POST', '/api/items', data);
    }

    /**
     * Update item
     */
    async updateItem(
        id: string,
        data: Partial<{
            title: string;
            description: string;
            status: 'draft' | 'active' | 'archived';
            metadata: Record<string, unknown>;
        }>
    ): Promise<ApiResponse<Item>> {
        return this.request<Item>('PUT', `/api/items/${id}`, data);
    }

    /**
     * Delete item
     */
    async deleteItem(id: string): Promise<ApiResponse<void>> {
        return this.request<void>('DELETE', `/api/items/${id}`);
    }

    /**
     * Get item statistics
     */
    async getItemStats(): Promise<ApiResponse<Record<string, number>>> {
        return this.request<Record<string, number>>('GET', '/api/items/stats');
    }

    // ----------------------------------------
    // HEALTH METHODS
    // ----------------------------------------

    /**
     * Check API health
     */
    async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
        return this.request<{ status: string; timestamp: string }>('GET', '/api/health');
    }

    /**
     * Check database health
     */
    async dbHealthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
        return this.request<{ status: string; timestamp: string }>('GET', '/api/db/health');
    }
}

// ========================================
// SINGLETON EXPORT
// ========================================

export const api = new ApiClient();

export default api;
