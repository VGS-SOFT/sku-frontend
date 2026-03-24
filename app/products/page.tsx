'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Copy, Check, Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { productsApi } from '@/lib/api';
import { Product } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll(search || undefined);
      setProducts(res.data.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function copySku(product: Product) {
    await navigator.clipboard.writeText(product.sku);
    setCopiedId(product.id);
    toast.success(`SKU copied: ${product.sku}`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.title}"?`)) return;
    try {
      await productsApi.remove(product.id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Products"
        description="Your product catalog with auto-generated SKU codes."
        action={
          <Link href="/products/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No products found.</p>
              <Link href="/products/new">
                <Button variant="outline" size="sm" className="mt-3">
                  <Plus className="h-4 w-4" /> Add your first product
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Title', 'SKU', 'Category', 'Attributes', 'Created', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className={cn('border-b border-border last:border-0 hover:bg-muted/30 transition-colors', !product.isActive && 'opacity-50')}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{product.title}</p>
                      {product.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{product.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-mono font-semibold">
                          {product.sku}
                        </code>
                        <button
                          onClick={() => copySku(product)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedId === product.id
                            ? <Check className="h-3.5 w-3.5 text-green-500" />
                            : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{product.category?.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(product.attributeValues ?? []).slice(0, 3).map((attr, i) => (
                          <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                            {attr.code}
                          </span>
                        ))}
                        {(product.attributeValues ?? []).length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{product.attributeValues.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(product.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/products/${product.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
