'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, Barcode } from 'lucide-react';
import { skusApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function CatalogPage() {
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [status,   setStatus]   = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['skus', { search, page, status }],
    queryFn:  () => skusApi.list({ search: search || undefined, page, limit: 20, status: status || undefined }).then(r => r.data),
  });

  const skus = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-950">SKU Catalog</h2>
          <p className="text-sm text-gray-500 mt-0.5">{meta?.total ?? 0} total SKUs</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => window.open('/api/v1/skus/export', '_blank')}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            className="flex h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            placeholder="Search SKU code or product name…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus-visible:outline-none"
          value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
          </div>
        ) : skus.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Barcode className="h-8 w-8 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-900">No SKUs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['SKU Code', 'Product Name', 'Category', 'Variants', 'Status', 'Created'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {skus.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5"><span className="font-mono font-semibold text-gray-900">{s.sku}</span></td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-[200px] truncate">{s.productName}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary">{s.category?.name}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {s.variants?.map((v: any) => (
                          <span key={v.id} className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">{v.variantValue?.code}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={s.isActive ? 'success' : 'secondary'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-400">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
