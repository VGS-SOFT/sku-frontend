'use client';

import { useQuery } from '@tanstack/react-query';
import { FolderTree, Tags, Layers, Barcode, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { skusApi, mastersApi, categoriesApi, variantsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: () => skusApi.analytics().then(r => r.data) });
  const { data: masters   } = useQuery({ queryKey: ['masters'],   queryFn: () => mastersApi.list().then(r => r.data) });
  const { data: varTypes  } = useQuery({ queryKey: ['varTypes'],  queryFn: () => variantsApi.listTypes().then(r => r.data) });
  const { data: cats      } = useQuery({ queryKey: ['categories'],queryFn: () => categoriesApi.list().then(r => r.data) });

  const stats = [
    { label: 'Master Categories', value: masters?.length ?? 0,          icon: FolderTree, href: '/masters' },
    { label: 'Total Categories',  value: cats?.length ?? 0,             icon: Tags,       href: '/categories' },
    { label: 'Variant Types',     value: varTypes?.length ?? 0,         icon: Layers,     href: '/variants' },
    { label: 'SKUs Generated',    value: analytics?.totalActive ?? 0,   icon: Barcode,    href: '/catalog' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-950">Good morning 👋</h2>
          <p className="mt-1 text-sm text-gray-500">Here’s what’s happening with your SKU catalog.</p>
        </div>
        <Link href="/skus">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            Generate SKU
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={href} href={href}>
            <Card className="group cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <div className="rounded-lg bg-gray-50 p-1.5 group-hover:bg-gray-100 transition-colors">
                    <Icon className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Quick actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Add Master',     href: '/masters',    desc: 'Create a master category' },
            { label: 'Add Category',   href: '/categories', desc: 'Build category tree' },
            { label: 'Add Variant',    href: '/variants',   desc: 'Define variant types' },
            { label: 'Bulk Import',    href: '/import',     desc: 'Import product list' },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="group cursor-pointer p-4 transition-all hover:shadow-md hover:border-gray-200">
                <p className="text-sm font-medium text-gray-900 group-hover:text-black">{a.label}</p>
                <p className="mt-0.5 text-xs text-gray-400">{a.desc}</p>
                <ArrowRight className="mt-2 h-3.5 w-3.5 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent SKUs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Recent SKUs</h3>
          <Link href="/catalog" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">View all →</Link>
        </div>
        <Card>
          <div className="divide-y divide-gray-50">
            {analytics?.recentActivity?.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-400">No SKUs generated yet.</p>
            )}
            {analytics?.recentActivity?.map((sku: any) => (
              <div key={sku.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900">{sku.sku}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sku.productName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{sku.category?.master?.code}</Badge>
                  <span className="text-xs text-gray-400">{formatDate(sku.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
