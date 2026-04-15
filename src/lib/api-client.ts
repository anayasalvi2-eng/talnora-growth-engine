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
  metadata?: any;
  createdAt: string;
  updatedAt: string;
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
export interface Topic {
  id: string;
  topic: string;
  score: number;
  source: string;
  status: 'suggested' | 'approved' | 'dismissed' | 'generated';
  suggestedType?: string;
  createdAt: string;
}
export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  template?: string;
  totalLeads: number;
  sentCount: number;
  openCount: number;
  createdAt: string;
}
export interface Blog {
  id: string;
  userId: string;
  title: string;
  slug: string;
  metaDescription?: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
}
export interface AppEvent {
  id: string;
  eventType: string;
  leadId?: string;
  userId?: string;
  metadata?: any;
  createdAt: string;
}
class ApiClient {
  private baseUrl: string = '';
  private token: string | null = localStorage.getItem('auth_token');
  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
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
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        if (contentType && contentType.includes('application/json')) {
            const errorData = await res.json();
            return { success: false, error: errorData.error || `Error ${res.status}` };
        }
        return { success: false, error: `Server Error ${res.status}` };
      }
      if (contentType && contentType.includes('application/json')) {
          return await res.json();
      }
      return { success: true } as any;
    } catch (e) {
      return { success: false, error: 'Network request failed' };
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
  async logout() { this.setToken(null); return { success: true }; }
  async getCurrentUser() { return this.request<User>('GET', '/api/auth/me'); }
  async updateProfile(data: Partial<User>) { return this.request<User>('PUT', '/api/auth/me', data); }
  async listItems(params?: any) { return this.request<Item[]>('GET', '/api/items'); }
  async createItem(data: { title: string; status: string }) { return this.request<Item>('POST', '/api/items', data); }
  async deleteItem(id: string) { return this.request<boolean>('DELETE', `/api/items/${id}`); }
  async listContent(type?: string) { return this.request<ContentAsset[]>('GET', `/api/content${type ? `?type=${type}` : ''}`); }
  async generateContent(type: string, topic: string) { return this.request<ContentAsset>('POST', '/api/content/generate', { type, topic }); }
  async listBlogs() { return this.request<Blog[]>('GET', '/api/blogs'); }
  async getBlogBySlug(slug: string) { return this.request<Blog>('GET', `/api/blogs/${slug}`); }
  async listTopics() { return this.request<Topic[]>('GET', '/api/topics'); }
  async approveTopic(id: string, status: string) { return this.request<Topic>('PATCH', `/api/topics/${id}`, { status }); }
  async listLeads(status?: string) { return this.request<Lead[]>('GET', `/api/leads${status ? `?status=${status}` : ''}`); }
  async bulkCreateLeads(leads: Partial<Lead>[]) { return this.request<Lead[]>('POST', '/api/leads/bulk', leads); }
  async scoreResume(file: File, email: string): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('email', email);
    try {
      const res = await fetch('/api/public/score-resume', { method: 'POST', body: formData });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType?.includes('application/json')) {
        return await res.json();
      }
      return { success: false, error: 'Upload failed: Server returned non-JSON response' };
    } catch (e) {
      return { success: false, error: 'Network error during upload' };
    }
  }
  async listCampaigns() { return this.request<Campaign[]>('GET', '/api/campaigns'); }
  async createCampaign(data: { name: string; template?: string; }) { return this.request<Campaign>('POST', '/api/campaigns', data); }
  async executeCampaign(id: string) { return this.request<Campaign>('POST', `/api/campaigns/${id}/execute`); }
  async deleteCampaign(id: string) { return this.request<boolean>('DELETE', `/api/campaigns/${id}`); }
  async getLeadStats() { return this.request<Record<string, number>>('GET', '/api/leads/stats'); }
  async getRecentEvents() { return this.request<AppEvent[]>('GET', '/api/events/recent'); }
  async updateLeadStatus(id: string, status: string) { return this.request<Lead>('PATCH', `/api/leads/${id}`, { status }); }
}
export const api = new ApiClient();