import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// shadcn/ui standard utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to readable string
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Code type badge colors
export const CODE_TYPE_COLORS: Record<string, string> = {
  CATEGORY: 'bg-blue-50 text-blue-700 border-blue-200',
  MATERIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  PRODUCT_TYPE: 'bg-purple-50 text-purple-700 border-purple-200',
  COLOR: 'bg-pink-50 text-pink-700 border-pink-200',
  STYLE: 'bg-teal-50 text-teal-700 border-teal-200',
  FINISH: 'bg-orange-50 text-orange-700 border-orange-200',
  SIZE: 'bg-green-50 text-green-700 border-green-200',
  CUSTOM: 'bg-gray-50 text-gray-700 border-gray-200',
};
