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

let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
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
    } finally {
      refreshPromise = null;
    }
    setAccessToken(null);
    return false;
  })();

  return refreshPromise;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const publicAuthEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/google',
    '/auth/send-otp',
    '/auth/verify-otp',
    '/auth/cancel-otp',
    '/auth/refresh',
  ];
  const isPublicAuthRoute = publicAuthEndpoints.some((p) => endpoint.startsWith(p));

  // If access token is not in memory and calling a protected/me endpoint, attempt silent refresh first
  if (!accessTokenMemory && !isPublicAuthRoute) {
    await refreshToken();
  }

  if (accessTokenMemory) {
    headers['Authorization'] = `Bearer ${accessTokenMemory}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  let data = await response.json();

  if (!response.ok || !data.success) {
    // Attempt silent refresh once on 401 if not already refreshing
    if (response.status === 401 && !isPublicAuthRoute) {
      const refreshed = await refreshToken();
      if (refreshed && accessTokenMemory) {
        headers['Authorization'] = `Bearer ${accessTokenMemory}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        data = await response.json();
        if (response.ok && data.success) {
          return data.data;
        }
      }
    }

    const message = data?.error?.details
      ? data.error.details.map((d: any) => d.message).join('. ')
      : data?.error?.message || 'An error occurred';
    const err: any = new Error(message);
    err.details = data?.error?.details;
    err.status = response.status;
    throw err;
  }

  return data.data;
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

  sendOtp: (email: string) =>
    request<{ message: string; otp?: string; expiresInSeconds: number }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  cancelOtp: (email: string) =>
    request<{ message: string }>('/auth/cancel-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (payload: { email: string; otp: string; name?: string; phone?: string; password?: string }) =>
    request<{ user: User; accessToken: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  // Super Admin Requests Management
  getPendingAdminRequests: () => request<{ requests: User[] }>('/users/admin-requests'),
  approveAdminRequest: (userId: string) =>
    request<{ user: User }>(`/users/admin-requests/${userId}/approve`, {
      method: 'PATCH',
    }),
  rejectAdminRequest: (userId: string) =>
    request<{ user: User }>(`/users/admin-requests/${userId}/reject`, {
      method: 'PATCH',
    }),

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
  /**
   * Two-step direct Cloudinary upload (bypasses Vercel 4.5MB body limit):
   * 1. Get a signed upload token from our backend
   * 2. POST the file directly to Cloudinary
   * 3. Record the result in our backend (saves to MongoDB)
   */
  uploadAsset: async (file: File, type: 'psd' | 'frame' | 'photo' | 'logo' | 'background' = 'photo'): Promise<Asset> => {
    // Step 1: get signature from our backend
    const sig = await request<{ signature: string; timestamp: number; apiKey: string; cloudName: string }>(
      '/assets/upload-signature?folder=poster_saas'
    );

    // Step 2: upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sig.apiKey);
    formData.append('timestamp', String(sig.timestamp));
    formData.append('signature', sig.signature);
    formData.append('folder', 'poster_saas');

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
      { method: 'POST', body: formData }
    );
    if (!cloudRes.ok) {
      const err = await cloudRes.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || 'Cloudinary upload failed');
    }
    const cloudData = await cloudRes.json() as {
      secure_url: string; public_id: string;
      width?: number; height?: number; format?: string; bytes?: number;
    };

    // Step 3: record the result in our backend
    return request<Asset>('/assets/record', {
      method: 'POST',
      body: JSON.stringify({
        url: cloudData.secure_url,
        publicId: cloudData.public_id,
        width: cloudData.width,
        height: cloudData.height,
        format: cloudData.format,
        size: cloudData.bytes,
        type,
      }),
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

  deleteUser: (userId: string) =>
    request<{ message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    }),
};
