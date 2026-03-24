'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { codeRegistryApi, categoriesApi, productsApi } from '@/lib/api';
import { Tag, FolderTree, Package, Barcode } from 'lucide-react';

interface Stats {
  codes: number;
  categories: number;
  products: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ codes: 0, categories: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [codes, categories, products] = await Promise.all([
          codeRegistryApi.getAll(),
          categoriesApi.getAll(),
          productsApi.getAll(),
        ]);
        setStats({
          codes: codes.data.data?.length ?? 0,
          categories: categories.data.data?.length ?? 0,
          products: products.data.data?.length ?? 0,
        });
      } catch {}
      finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Code Mappings', value: stats.codes, icon: Tag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Categories', value: stats.categories, icon: FolderTree, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Products', value: stats.products, icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Overview of your SKU catalog"
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-3xl font-semibold mt-1">
                      {loading ? <span className="text-muted-foreground">...</span> : s.value}
                    </p>
                  </div>
                  <div className={`h-11 w-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Barcode className="h-4 w-4" />
            How SKU Generation Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {[
              { step: '1', title: 'Register Codes', desc: 'Go to Code Registry → Add short codes for every concept (colors, materials, types, sizes).' },
              { step: '2', title: 'Build Categories', desc: 'Go to Categories → Create your N-level hierarchy. Assign an attribute schema to each leaf category.' },
              { step: '3', title: 'Add Products', desc: 'Go to Products → Fill product details. SKU is auto-generated from category path + attribute selections.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
