'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Sparkles, Copy, Check, Save } from 'lucide-react';
import { mastersApi, categoriesApi, variantsApi, skusApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const saveSchema = z.object({
  productName: z.string().min(2, 'Product name is required (min 2 chars)'),
});
type SaveForm = z.infer<typeof saveSchema>;

export default function SkuGeneratorPage() {
  const qc = useQueryClient();
  const [selectedMaster,    setSelectedMaster]    = useState<any>(null);
  const [categoryPath,      setCategoryPath]      = useState<any[]>([]);
  const [variantSelections, setVariantSelections] = useState<Record<number, number>>({});
  const [previewSku,        setPreviewSku]        = useState<string>('');
  const [isDuplicate,       setIsDuplicate]       = useState(false);
  const [copied,            setCopied]            = useState(false);
  const [isPreviewing,      setIsPreviewing]      = useState(false);

  const selectedCategory = categoryPath[categoryPath.length - 1] ?? null;

  const { data: masters  = [] } = useQuery({ queryKey: ['masters'],  queryFn: () => mastersApi.list().then(r => r.data) });
  const { data: varTypes = [] } = useQuery({ queryKey: ['varTypes'], queryFn: () => variantsApi.listTypes().then(r => r.data) });

  const { data: rootCats = [] } = useQuery({
    queryKey: ['cats-root', selectedMaster?.id],
    queryFn:  () => categoriesApi.children(selectedMaster.id).then(r => r.data),
    enabled:  !!selectedMaster?.id,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SaveForm>({
    resolver: zodResolver(saveSchema),
  });

  // Auto-preview whenever selections change
  useEffect(() => {
    const variantCount = Object.keys(variantSelections).length;
    if (!selectedCategory || variantCount === 0) { setPreviewSku(''); return; }

    const variants = Object.entries(variantSelections).map(([typeId, valueId]) => ({
      variantTypeId: Number(typeId),
      variantValueId: Number(valueId),
    }));

    setIsPreviewing(true);
    skusApi.preview({ categoryId: selectedCategory.id, variants })
      .then(r => {
        setPreviewSku(r.data.sku);
        setIsDuplicate(r.data.isDuplicate ?? false);
      })
      .catch(() => setPreviewSku(''))
      .finally(() => setIsPreviewing(false));
  }, [selectedCategory, variantSelections]);

  const createMut = useMutation({
    mutationFn: (productName: string) => skusApi.create({
      productName,
      categoryId: selectedCategory!.id,
      variants: Object.entries(variantSelections).map(([typeId, valueId]) => ({
        variantTypeId: Number(typeId),
        variantValueId: Number(valueId),
      })),
    }),
    onSuccess: (res) => {
      toast.success(`SKU saved: ${res.data.sku}`);
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['skus'] });
      reset();
      setVariantSelections({});
      setPreviewSku('');
      setCategoryPath([]);
    },
    onError: (e: any) => {
      const d = e.response?.data;
      if (d?.code === 'DUPLICATE_SKU') toast.error(`Duplicate! Suggested: ${d.suggestion}`);
      else toast.error(d?.message || 'Failed to save SKU');
    },
  });

  const onSave = (data: SaveForm) => createMut.mutate(data.productName);

  const selectAtLevel = (cat: any, level: number) => {
    setCategoryPath(prev => [...prev.slice(0, level), cat]);
    setVariantSelections({});
    setPreviewSku('');
  };

  const copy = () => {
    navigator.clipboard.writeText(previewSku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleVariant = (typeId: number, valueId: number) => {
    setVariantSelections(prev => {
      if (prev[typeId] === valueId) {
        const next = { ...prev };
        delete next[typeId];
        return next;
      }
      return { ...prev, [typeId]: valueId };
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* ── Left: config ── */}
      <div className="space-y-5 lg:col-span-3">
        <div>
          <h2 className="text-xl font-bold text-gray-950">SKU Generator</h2>
          <p className="text-sm text-gray-500 mt-0.5">Select category path and variants to build the SKU code.</p>
        </div>

        {/* Step 1 — Master */}
        <Card>
          <CardHeader><CardTitle>1. Master category</CardTitle></CardHeader>
          <CardContent>
            {masters.length === 0 ? (
              <p className="text-sm text-gray-400">No masters yet. <a href="/masters" className="underline">Create one →</a></p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {masters.map((m: any) => (
                  <button key={m.id}
                    onClick={() => { setSelectedMaster(m); setCategoryPath([]); setVariantSelections({}); setPreviewSku(''); }}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-all',
                      selectedMaster?.id === m.id
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400',
                    )}>
                    {m.name}
                    <span className={cn('font-mono text-xs', selectedMaster?.id === m.id ? 'opacity-60' : 'text-gray-400')}>
                      {m.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2 — Category path drill-down */}
        {selectedMaster && (
          <Card>
            <CardHeader>
              <CardTitle>2. Category path</CardTitle>
              <CardDescription>Drill down to the product type. Deeper = more specific SKU.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Level 0 — direct children of master */}
              <CategoryLevel
                items={rootCats}
                level={0}
                selected={categoryPath[0]}
                onSelect={(c) => selectAtLevel(c, 0)}
              />
              {/* Dynamic deeper levels */}
              {categoryPath.map((cat, idx) => (
                <DeeperLevel
                  key={`${cat.id}-${idx}`}
                  parentId={cat.id}
                  level={idx + 1}
                  selected={categoryPath[idx + 1]}
                  onSelect={(c) => selectAtLevel(c, idx + 1)}
                />
              ))}
              {/* Breadcrumb */}
              {categoryPath.length > 0 && (
                <div className="flex items-center gap-1 pt-1 text-xs text-gray-400">
                  <span className="font-medium text-gray-600">{selectedMaster.name}</span>
                  {categoryPath.map((c) => (
                    <span key={c.id} className="flex items-center gap-1">
                      <span>›</span>
                      <span className="font-medium text-gray-700">{c.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Variants */}
        {selectedCategory && (
          <Card>
            <CardHeader>
              <CardTitle>3. Variants</CardTitle>
              <CardDescription>Select one value per variant type. Click again to deselect.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {varTypes.length === 0 ? (
                <p className="text-sm text-gray-400">No variants. <a href="/variants" className="underline">Create some →</a></p>
              ) : varTypes.map((vt: any) => (
                <div key={vt.id}>
                  <p className="mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{vt.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vt.values?.map((v: any) => (
                      <button key={v.id}
                        onClick={() => toggleVariant(vt.id, v.id)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs transition-all',
                          variantSelections[vt.id] === v.id
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400',
                        )}>
                        {v.name}
                        <span className={cn('ml-1 font-mono', variantSelections[vt.id] === v.id ? 'opacity-60' : 'text-gray-400')}>
                          {v.code}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Right: Preview + Save ── */}
      <div className="lg:col-span-2">
        <Card className="sticky top-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gray-400" />
              <CardTitle>Preview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedCategory ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-3 rounded-full border-2 border-dashed border-gray-200 p-4">
                  <Sparkles className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">Select master → category → variants</p>
              </div>
            ) : isPreviewing ? (
              <div className="flex justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
              </div>
            ) : previewSku ? (
              <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                {/* SKU display */}
                <div className={cn(
                  'rounded-xl border-2 p-4 text-center transition-colors',
                  isDuplicate ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50',
                )}>
                  <p className="font-mono text-lg font-bold tracking-widest text-gray-950 break-all">
                    {previewSku}
                  </p>
                  {isDuplicate && (
                    <Badge variant="destructive" className="mt-2">Already exists</Badge>
                  )}
                </div>

                {/* Copy button */}
                <button type="button" onClick={copy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  {copied
                    ? <><Check className="h-3.5 w-3.5 text-green-600" /> Copied!</>
                    : <><Copy className="h-3.5 w-3.5" /> Copy SKU</>}
                </button>

                {/* Product name + save */}
                {!isDuplicate && (
                  <>
                    <Input
                      label="Product name *"
                      placeholder="e.g. Transparent Poshak Size 3"
                      error={errors.productName?.message}
                      {...register('productName')}
                    />
                    <Button type="submit" className="w-full" isLoading={isSubmitting || createMut.isPending}>
                      <Save className="h-3.5 w-3.5" /> Save SKU
                    </Button>
                  </>
                )}
              </form>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="text-sm text-gray-400">Select at least one variant to preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function CategoryLevel({ items, level, selected, onSelect }: {
  items: any[]; level: number; selected?: any; onSelect: (c: any) => void;
}) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Level {level + 1}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((c: any) => (
          <button key={c.id} onClick={() => onSelect(c)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-all',
              selected?.id === c.id
                ? 'border-black bg-black text-white'
                : 'border-gray-200 text-gray-700 hover:border-gray-400',
            )}>
            {c.name}
            <span className={cn('font-mono text-xs', selected?.id === c.id ? 'opacity-60' : 'text-gray-400')}>
              {c.code}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DeeperLevel({ parentId, level, selected, onSelect }: {
  parentId: number; level: number; selected?: any; onSelect: (c: any) => void;
}) {
  const { data: children = [] } = useQuery({
    queryKey: ['cat-children', parentId],
    queryFn:  () => categoriesApi.children(parentId).then(r => r.data),
    enabled:  !!parentId,
  });
  return <CategoryLevel items={children} level={level} selected={selected} onSelect={onSelect} />;
}
