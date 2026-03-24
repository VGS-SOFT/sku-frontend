import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse,
  CodeRegistry,
  CodeType,
  Category,
  Product,
  SkuPreviewResult,
  CreateCodeRegistryForm,
  CreateCategoryForm,
  CreateProductForm,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Response interceptor - unwraps data, throws on error
client.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiResponse<null>>) => {
    const message = error.response?.data?.message || error.message || 'Network error';
    throw new Error(message);
  }
);

// ── Code Registry ──────────────────────────────────────────
export const codeRegistryApi = {
  getAll: (type?: CodeType) =>
    client.get<ApiResponse<CodeRegistry[]>>('/code-registry', { params: type ? { type } : {} }),

  getOne: (id: number) =>
    client.get<ApiResponse<CodeRegistry>>(`/code-registry/${id}`),

  create: (data: CreateCodeRegistryForm) =>
    client.post<ApiResponse<CodeRegistry>>('/code-registry', data),

  update: (id: number, data: Partial<CreateCodeRegistryForm>) =>
    client.patch<ApiResponse<CodeRegistry>>(`/code-registry/${id}`, data),

  remove: (id: number) =>
    client.delete<ApiResponse<null>>(`/code-registry/${id}`),
};

// ── Categories ─────────────────────────────────────────────
export const categoriesApi = {
  getTree: () =>
    client.get<ApiResponse<Category[]>>('/categories/tree'),

  getAll: () =>
    client.get<ApiResponse<Category[]>>('/categories'),

  getOne: (id: number) =>
    client.get<ApiResponse<Category>>(`/categories/${id}`),

  getPath: (id: number) =>
    client.get<ApiResponse<Category[]>>(`/categories/${id}/path`),

  create: (data: CreateCategoryForm) =>
    client.post<ApiResponse<Category>>('/categories', data),

  update: (id: number, data: Partial<CreateCategoryForm>) =>
    client.patch<ApiResponse<Category>>(`/categories/${id}`, data),

  remove: (id: number) =>
    client.delete<ApiResponse<null>>(`/categories/${id}`),
};

// ── Products ───────────────────────────────────────────────
export const productsApi = {
  getAll: (search?: string) =>
    client.get<ApiResponse<Product[]>>('/products', { params: search ? { search } : {} }),

  getOne: (id: number) =>
    client.get<ApiResponse<Product>>(`/products/${id}`),

  getBySku: (sku: string) =>
    client.get<ApiResponse<Product>>(`/products/by-sku/${sku}`),

  create: (data: CreateProductForm) =>
    client.post<ApiResponse<Product>>('/products', data),

  update: (id: number, data: { title?: string; description?: string; isActive?: boolean; notes?: string }) =>
    client.patch<ApiResponse<Product>>(`/products/${id}`, data),

  remove: (id: number) =>
    client.delete<ApiResponse<null>>(`/products/${id}`),
};

// ── SKU Engine ─────────────────────────────────────────────
export const skuEngineApi = {
  preview: (categoryId: number, attributes: { attributeType: string; code: string }[]) =>
    client.post<ApiResponse<SkuPreviewResult>>('/sku-engine/preview', { categoryId, attributes }),
};
