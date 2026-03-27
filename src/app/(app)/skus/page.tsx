'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Sparkles, Copy, Check, ChevronRight } from 'lucide-react';
import { mastersApi, categoriesApi, variantsApi, skusApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SkuGeneratorPage() {
  const qc = useQueryClient();
  const [selectedMaster,   setSelectedMaster]   = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryPath,     setCategoryPath]      = useState<any[]>([]);
  const [variantSelections, setVariantSelections] = useState<Record<number, number>>({});
  const [previewSku,        setPreviewSku]        = useState<string>('');
  const [isDuplicate,       setIsDuplicate]       = useState(false);
  const [copied,            setCopied]            = useState(false);
  const [productName,       setProductName]       = useState('');

  const { data: masters   = [] } = useQuery({ queryKey: ['masters'],   queryFn: () => mastersApi.list().then(r => r.data) });
  const { data: varTypes  = [] } = useQuery({ queryKey: ['varTypes'],  queryFn: () => variantsApi.listTypes().then(r => r.data) });

  const { data: rootCats  = [] } = useQuery({
    queryKey: ['cats-root', selectedMaster?.id],
    queryFn:  () => categoriesApi.list({ masterId: selectedMaster?.id, depth: 0 }).then(r => r.data),
    enabled:  !!selectedMaster,
  });

  const getChildren = (parentId: number) => categoriesApi.children(parentId).then(r => r.data);

  // Auto-preview
  useEffect(() => {
    if (!selectedCategory) { setPreviewSku(''); return; }
    const variants = Object.entries(variantSelections).map(([typeId, valueId]) => ({
      variantTypeId: Number(typeId), variantValueId: valueId,
    }));
    if (variants.length === 0) { setPreviewSku(''); return; }
    skusApi.preview({ categoryId: selectedCategory.id, variants })
      .then(r => { setPreviewSku(r.data.sku); setIsDuplicate(r.data.isDuplicate); })
      .catch(() => {});
  }, [selectedCategory, variantSelections]);

  const createMut = useMutation({
    mutationFn: () => skusApi.create({
      productName,
      categoryId: selectedCategory!.id,
      variants: Object.entries(variantSelections).map(([typeId, valueId]) => ({
        variantTypeId: Number(typeId), variantValueId: valueId,
      })),
    }),
    onSuccess: (res) => {
      toast.success(`SKU saved: ${res.data.sku}`);
      qc.invalidateQueries({ queryKey: ['analytics'] });
      setProductName(''); setVariantSelections({}); setPreviewSku('');
    },
    onError: (e: any) => {
      const d = e.response?.data;
      if (d?.code === 'DUPLICATE_SKU') toast.error(`Duplicate! Suggested: ${d.suggestion}`);
      else toast.error(d?.message || 'Failed to save');
    },
  });

  const selectCategory = async (cat: any, level: number) => {
    const newPath = [...categoryPath.slice(0, level), cat];
    setCategoryPath(newPath);
    setSelectedCategory(cat);
    setVariantSelections({});
  };

  const copy = () => {
    navigator.clipboard.writeText(previewSku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Left — Config */}
      <div className="space-y-5 lg:col-span-3">
        <div>
          <h2 className="text-xl font-bold text-gray-950">SKU Generator</h2>
          <p className="text-sm text-gray-500 mt-0.5">Select category path and variant values to build the SKU.</p>
        </div>

        {/* Step 1 — Master */}
        <Card>
          <CardHeader><CardTitle>1. Select master</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {masters.map((m: any) => (
                <button key={m.id}
                  onClick={() => { setSelectedMaster(m); setSelectedCategory(null); setCategoryPath([]); setVariantSelections({}); }}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-all',
                    selectedMaster?.id === m.id
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400',
                  )}>
                  {m.name} <span className="font-mono text-xs opacity-60">{m.code}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 2 — Category Drill Down */}
        {selectedMaster && (
          <Card>
            <CardHeader>
              <CardTitle>2. Select category path</CardTitle>
              <CardDescription>Drill down to the specific product type.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Level 0 */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Level 1</p>
                <div className="flex flex-wrap gap-2">
                  {rootCats.map((c: any) => (
                    <CategoryChip key={c.id} cat={c} selected={categoryPath[0]?.id === c.id}
                      onClick={() => selectCategory(c, 0)} />
                  ))}
                </div>
              </div>
              {/* Dynamic deeper levels */}
              {categoryPath.map((cat, idx) => (
                <DeeperLevel key={cat.id} parentId={cat.id} level={idx + 1}
                  selected={categoryPath[idx + 1]}
                  onSelect={(c) => selectCategory(c, idx + 1)} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Variants */}
        {selectedCategory && (
          <Card>
            <CardHeader><CardTitle>3. Select variants</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {varTypes.map((vt: any) => (
                <div key={vt.id}>
                  <p className="mb-1.5 text-xs font-medium text-gray-500">{vt.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vt.values?.map((v: any) => (
                      <button key={v.id}
                        onClick={() => setVariantSelections(prev => ({ ...prev, [vt.id]: v.id }))}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs transition-all',
                          variantSelections[vt.id] === v.id
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400',
                        )}>
                        {v.name} <span className="opacity-60 font-mono">{v.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right — Preview */}
      <div className="lg:col-span-2">
        <Card className="sticky top-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gray-400" />
              <CardTitle>Generated SKU</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {previewSku ? (
              <>
                <div className={cn(
                  'rounded-xl border-2 p-4 text-center transition-colors',
                  isDuplicate ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50',
                )}>
                  <p className="font-mono text-xl font-bold tracking-wider text-gray-950">{previewSku}</p>
                  {isDuplicate && (
                    <Badge variant="destructive" className="mt-2">Duplicate — already exists</Badge>
                  )}
                </div>
                <button onClick={copy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  {copied ? <><Check className="h-3.5 w-3.5 text-green-600" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy SKU</>}
                </button>
                <Input label="Product name" placeholder="e.g. Transparent Poshak Size 3"
                  value={productName} onChange={e => setProductName(e.target.value)} />
                <Button className="w-full" disabled={!productName || isDuplicate}
                  isLoading={createMut.isPending} onClick={() => createMut.mutate()}>
                  Save SKU
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 rounded-full border-2 border-dashed border-gray-200 p-4">
                  <Sparkles className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">Select a category and variants to generate SKU</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CategoryChip({ cat, selected, onClick }: { cat: any; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-all',
        selected ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400',
      )}>
      {cat.name} <span className={cn('font-mono text-xs', selected ? 'opacity-60' : 'text-gray-400')}>{cat.code}</span>
    </button>
  );
}

function DeeperLevel({ parentId, level, selected, onSelect }: { parentId: number; level: number; selected?: any; onSelect: (c: any) => void }) {
  const { data: children = [] } = useQuery({
    queryKey: ['cat-children', parentId],
    queryFn:  () => categoriesApi.children(parentId).then(r => r.data),
  });
  if (children.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Level {level + 1}</p>
      <div className="flex flex-wrap gap-2">
        {children.map((c: any) => (
          <CategoryChip key={c.id} cat={c} selected={selected?.id === c.id} onClick={() => onSelect(c)} />
        ))}
      </div>
    </div>
  );
}
