// ============================================================
// Global TypeScript interfaces - mirrors backend entities
// ============================================================

export type CodeType =
  | 'CATEGORY'
  | 'MATERIAL'
  | 'PRODUCT_TYPE'
  | 'COLOR'
  | 'STYLE'
  | 'FINISH'
  | 'SIZE'
  | 'CUSTOM';

export interface CodeRegistry {
  id: number;
  label: string;
  code: string;
  type: CodeType;
  description?: string;
  isUsed: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeSchemaItem {
  id?: number;
  attributeType: string;
  attributeLabel: string;
  order: number;
  isRequired: boolean;
  placeholderCode?: string;
}

export interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  isLeaf: boolean;
  parentId?: number;
  parent?: Category;
  children?: Category[];
  attributeSchema?: AttributeSchemaItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttributeValue {
  attributeType: string;
  code: string;
  label?: string;
}

export interface Product {
  id: number;
  title: string;
  description?: string;
  sku: string;
  categoryId: number;
  category: Category;
  attributeValues: ProductAttributeValue[];
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkuPreviewResult {
  sku: string;
  segments: string[];
  categoryPath: string[];
  attributeCodes: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
  timestamp: string;
}

// Form types
export interface CreateCodeRegistryForm {
  label: string;
  code: string;
  type: CodeType;
  description?: string;
}

export interface CreateCategoryForm {
  name: string;
  code: string;
  description?: string;
  parentId?: number;
  isLeaf: boolean;
  attributeSchema?: AttributeSchemaItem[];
}

export interface CreateProductForm {
  title: string;
  description?: string;
  categoryId: number;
  attributes: ProductAttributeValue[];
  notes?: string;
}
