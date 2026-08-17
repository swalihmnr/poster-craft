import {
  User,
  Program,
  TemplateConfig,
  Asset,
  PosterGeneration,
  UserPosterInput,
} from '../types';

const API_BASE_URL = '/api/v1';

let accessTokenMemory: string | null = null;

export function setAccessToken(token: string | null) {
  accessTokenMemory = token;
}

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessTokenMemory) {
    headers['Authorization'] = `Bearer ${accessTokenMemory}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // include cookies for refresh token
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    // Check if token expired and attempt silent refresh
    if (response.status === 401 && data?.error?.code === 'TOKEN_EXPIRED') {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${accessTokenMemory}`;
        const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        const retryData = await retryRes.json();
        if (retryRes.ok && retryData.success) {
          return retryData.data;
        }
      }
    }
    const message = data?.error?.message || 'An error occurred';
    throw new Error(message);
  }

  return data.data;
}

async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    if (res.ok && data.success && data.data?.accessToken) {
      setAccessToken(data.data.accessToken);
      return true;
    }
  } catch (err) {
    console.error('Silent refresh failed:', err);
  }
  setAccessToken(null);
  return false;
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string; role?: string }) =>
    request<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (credentials: { email: string; password: string }) =>
    request<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  googleLogin: (payload: { email: string; name?: string; avatar?: string; credential?: string }) =>
    request<{ user: User; accessToken: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  // Programs
  getPublicPrograms: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    return request<Program[]>(`/programs?${query.toString()}`);
  },

  getProgramBySlug: (slug: string) => request<Program>(`/programs/${slug}`),

  getPublicProgramById: (id: string) => request<Program>(`/programs/id/${id}`),

  getProgramById: (id: string) => request<Program>(`/admin/programs/${id}`),

  createProgram: (payload: Partial<Program>) =>
    request<Program>('/admin/programs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProgram: (id: string, payload: Partial<Program>) =>
    request<Program>(`/admin/programs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateProgramStatus: (id: string, status: 'draft' | 'published' | 'archived') =>
    request<Program>(`/admin/programs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteProgram: (id: string) =>
    request<{ message: string }>(`/admin/programs/${id}`, {
      method: 'DELETE',
    }),

  getAdminPrograms: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    return request<Program[]>(`/admin/programs?${query.toString()}`);
  },

  // Templates
  getAdminTemplates: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    return request<TemplateConfig[]>(`/admin/templates?${query.toString()}`);
  },

  getTemplateById: (id: string) => request<TemplateConfig>(`/admin/templates/${id}`),

  createTemplate: (payload: Partial<TemplateConfig>) =>
    request<TemplateConfig>('/admin/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTemplate: (id: string, payload: Partial<TemplateConfig>) =>
    request<TemplateConfig>(`/admin/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteTemplate: (id: string) =>
    request<{ message: string }>(`/admin/templates/${id}`, {
      method: 'DELETE',
    }),

  // Assets
  uploadAsset: (file: File, type: 'psd' | 'frame' | 'photo' | 'logo' | 'background' = 'photo') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return request<Asset>('/assets/upload', {
      method: 'POST',
      body: formData,
    });
  },

  listAssets: (params?: { type?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.page) query.append('page', params.page.toString());
    return request<Asset[]>(`/assets?${query.toString()}`);
  },

  deleteAsset: (id: string) =>
    request<{ message: string }>(`/assets/${id}`, {
      method: 'DELETE',
    }),

  // Posters
  logPosterGeneration: (payload: { programId: string; templateId: string; input: UserPosterInput; format?: string }) =>
    request<PosterGeneration>('/posters', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Analytics & Admin Stats
  getAdminStats: () =>
    request<{
      totalPrograms: number;
      publishedPrograms: number;
      totalTemplates: number;
      totalUsers: number;
      totalPosterGenerations: number;
      recentActivity: any[];
    }>('/admin/analytics'),

  getAdminUsers: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return request<{ users: User[]; total: number; page: number; limit: number }>(`/admin/users?${query.toString()}`);
  },
};
