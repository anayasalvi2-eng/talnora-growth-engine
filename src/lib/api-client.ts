export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    total?: number;
}
export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
}
export interface ContentAsset {
    id: string;
    type: 'blog' | 'linkedin' | 'reddit' | 'video_script' | 'email';
    topic: string;
    content: string;
    status: 'draft' | 'published' | 'archived';
    createdAt: string;
}
class ApiClient {
    private baseUrl: string = '';
    private token: string | null = localStorage.getItem('auth_token');
    setToken(token: string | null) {
        this.token = token;
        token ? localStorage.setItem('auth_token', token) : localStorage.removeItem('auth_token');
    }
    isAuthenticated() { return !!this.token; }
    private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        try {
            const res = await fetch(`${this.baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
            return await res.json();
        } catch (e) {
            return { success: false, error: 'Request failed' };
        }
    }
    async register(email: string, password: string) {
        const res = await this.request<any>('POST', '/api/auth/register', { email, password });
        if (res.success) this.setToken(res.data.token);
        return res;
    }
    async login(email: string, password: string) {
        const res = await this.request<any>('POST', '/api/auth/login', { email, password });
        if (res.success) this.setToken(res.data.token);
        return res;
    }
    async getCurrentUser() { return this.request<User>('GET', '/api/auth/me'); }
    async listContent(type?: string) {
        return this.request<ContentAsset[]>('GET', `/api/content${type ? `?type=${type}` : ''}`);
    }
    async generateContent(type: string, topic: string) {
        return this.request<ContentAsset>('POST', '/api/content/generate', { type, topic });
    }
}
export const api = new ApiClient();