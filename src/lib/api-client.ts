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
  username?: string;
  avatarUrl: string | null;
  createdAt: string;
  theme?: string;
}
export interface Item {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
}
export interface Lead {
  id: string;
  email: string;
  name?: string;
  source: string;
  resumeScore?: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'archived';
  createdAt: string;
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
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
  isAuthenticated() { return !!this.token; }
  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    try {
      const res = await fetch(`${this.baseUrl}${path}`, { 
        method, 
        headers, 
        body: body ? JSON.stringify(body) : undefined 
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Request failed' };
    }
  }
  async register(email: string, password: string, displayName?: string, username?: string) {
    const res = await this.request<any>('POST', '/api/auth/register', { email, password, displayName, username });
    if (res.success && res.data?.token) this.setToken(res.data.token);
    return res;
  }
  async login(email: string, password: string) {
    const res = await this.request<any>('POST', '/api/auth/login', { email, password });
    if (res.success && res.data?.token) this.setToken(res.data.token);
    return res;
  }
  async logout() {
    this.setToken(null);
    return { success: true };
  }
  async updateProfile(data: Partial<User>) {
    return this.request<User>('PUT', '/api/auth/me', data);
  }
  async getCurrentUser() { return this.request<User>('GET', '/api/auth/me'); }
  // Items CRUD
  async listItems(options?: { limit?: number }) {
    return this.request<Item[]>('GET', '/api/items');
  }
  async createItem(data: Partial<Item>) {
    return this.request<Item>('POST', '/api/items', data);
  }
  async deleteItem(id: string) {
    return this.request<boolean>('DELETE', `/api/items/${id}`);
  }
  // Content Methods
  async listContent(type?: string) {
    return this.request<ContentAsset[]>('GET', `/api/content${type ? `?type=${type}` : ''}`);
  }
  async generateContent(type: string, topic: string) {
    return this.request<ContentAsset>('POST', '/api/content/generate', { type, topic });
  }
  // Lead Methods
  async listLeads(status?: string) {
    return this.request<Lead[]>('GET', `/api/leads${status ? `?status=${status}` : ''}`);
  }
  async updateLeadStatus(id: string, status: string) {
    return this.request<Lead>('PATCH', `/api/leads/${id}`, { status });
  }
  async getLeadStats() {
    return this.request<Record<string, number>>('GET', '/api/leads/stats');
  }
}
export const api = new ApiClient();