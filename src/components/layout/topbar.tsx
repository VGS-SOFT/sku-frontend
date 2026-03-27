'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/dashboard':  { title: 'Dashboard',    description: 'Overview of your SKU catalog' },
  '/masters':    { title: 'Masters',      description: 'Top-level product groupings' },
  '/categories': { title: 'Categories',   description: 'N-level category tree builder' },
  '/variants':   { title: 'Variants',     description: 'Variant types and values' },
  '/skus':       { title: 'SKU Generator',description: 'Generate and preview SKU codes' },
  '/catalog':    { title: 'SKU Catalog',  description: 'Browse all generated SKUs' },
  '/import':     { title: 'Bulk Import',  description: 'Map and import product lists' },
  '/templates':  { title: 'Templates',    description: 'Saved SKU generation templates' },
  '/audit':      { title: 'Audit Logs',   description: 'System activity history' },
};

export function Topbar() {
  const pathname = usePathname();
  const page = pageTitles[pathname] ?? { title: 'SKU Engine', description: '' };

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-100 bg-white px-6">
      <div>
        <h1 className="text-sm font-semibold text-gray-900">{page.title}</h1>
        {page.description && (
          <p className="text-xs text-gray-400">{page.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
