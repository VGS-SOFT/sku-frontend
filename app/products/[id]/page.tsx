'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { productsApi } from '@/lib/api';
import { Product } from '@/lib/types';
import { formatDate, CODE_TYPE_COLORS, cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await productsApi.getOne(parseInt(params.id as string));
        setProduct(res.data.data);
      } catch (e: any) {
        toast.error(e.message);
        router.push('/products');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function copySku() {
    if (!product) return;
    await navigator.clipboard.writeText(product.sku);
    setCopied(true);
    toast.success('SKU copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>;
  if (!product) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={product.title}
        description={product.description ?? 'No description'}
        action={
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          {/* SKU */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Generated SKU</p>
              <div className="flex items-center gap-3">
                <code className="text-2xl font-bold font-mono text-primary">{product.sku}</code>
                <button onClick={copySku} className="text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Attributes */}
          {product.attributeValues?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Attribute Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {product.attributeValues.map((attr, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={cn('text-xs px-2 py-0.5 rounded-md border font-medium', CODE_TYPE_COLORS[attr.attributeType] ?? CODE_TYPE_COLORS['CUSTOM'])}>
                          {attr.attributeType}
                        </span>
                        <span className="text-sm">{attr.label ?? attr.code}</span>
                      </div>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{attr.code}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Meta */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium mt-0.5">{product.category?.name}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="mt-0.5">{product.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-0.5">{formatDate(product.createdAt)}</p>
              </div>
              {product.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="mt-0.5 text-muted-foreground">{product.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
