import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — auto redirect to /login on 401
if (typeof window !== 'undefined') {
  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          await api.post('/auth/refresh');
          return api(originalRequest);
        } catch {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    },
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:   (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout:  () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me:      () => api.get('/auth/me'),
};

// ── Masters ───────────────────────────────────────────────────────────────────
export const mastersApi = {
  list:   () => api.get('/masters'),
  tree:   (id: number) => api.get(`/masters/${id}/tree`),
  create: (data: any) => api.post('/masters', data),
  update: (id: number, data: any) => api.patch(`/masters/${id}`, data),
  remove: (id: number) => api.delete(`/masters/${id}`),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list:      (params?: any) => api.get('/categories', { params }),
  tree:      () => api.get('/categories/tree'),
  ancestors: (id: number) => api.get(`/categories/${id}/ancestors`),
  children:  (id: number) => api.get(`/categories/${id}/children`),
  create:    (data: any) => api.post('/categories', data),
  update:    (id: number, data: any) => api.patch(`/categories/${id}`, data),
  remove:    (id: number) => api.delete(`/categories/${id}`),
};

// ── Variants ──────────────────────────────────────────────────────────────────
export const variantsApi = {
  listTypes:   () => api.get('/variant-types'),
  getValues:   (typeId: number) => api.get(`/variant-types/${typeId}/values`),
  createType:  (data: any) => api.post('/variant-types', data),
  updateType:  (id: number, data: any) => api.patch(`/variant-types/${id}`, data),
  deleteType:  (id: number) => api.delete(`/variant-types/${id}`),
  createValue: (typeId: number, data: any) => api.post(`/variant-types/${typeId}/values`, data),
  updateValue: (valueId: number, data: any) => api.patch(`/variant-types/values/${valueId}`, data),
  deleteValue: (valueId: number) => api.delete(`/variant-types/values/${valueId}`),
};

// ── SKUs ──────────────────────────────────────────────────────────────────────
export const skusApi = {
  list:           (params?: any) => api.get('/skus', { params }),
  get:            (id: number) => api.get(`/skus/${id}`),
  byCode:         (sku: string) => api.get(`/skus/by-code/${sku}`),
  preview:        (data: any) => api.post('/skus/preview', data),
  checkDuplicate: (sku: string) => api.post('/skus/check-duplicate', { sku }),
  create:         (data: any) => api.post('/skus', data),
  update:         (id: number, data: any) => api.patch(`/skus/${id}`, data),
  remove:         (id: number) => api.delete(`/skus/${id}`),
  analytics:      () => api.get('/skus/analytics'),
};

// ── Audit ─────────────────────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: any) => api.get('/audit', { params }),
};
