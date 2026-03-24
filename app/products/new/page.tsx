'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { categoriesApi, codeRegistryApi, productsApi, skuEngineApi } from '@/lib/api';
import { Category, CodeRegistry, AttributeSchemaItem, ProductAttributeValue } from '@/lib/types';
import { cn } from '@/lib/utils';

// Flatten tree to list of leaf categories only — deduplicated by id
function flattenLeafCategories(cats: Category[]): Category[] {
  const seen = new Set<number>();
  function walk(list: Category[]): Category[] {
    return list.reduce<Category[]>((acc, c) => {
      if (c.isLeaf) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          return [...acc, c];
        }
        return acc;
      }
      return [...acc, ...(c.children ? walk(c.children) : [])];
    }, []);
  }
  return walk(cats);
}

export default function NewProductPage() {
  const router = useRouter();
  const [leafCategories, setLeafCategories] = useState<Category[]>([]);
  const [allCodes, setAllCodes] = useState<CodeRegistry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [skuPreview, setSkuPreview] = useState<string>('');
  const [skuSegments, setSkuSegments] = useState<string[]>([]);
  const [skuError, setSkuError] = useState<string>('');
  const [skuLoading, setSkuLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    notes: '',
    mrp: '',
    sellingPrice: '',
    costPrice: '',
    unit: 'PCS',
    hsnCode: '',
    gstRate: '',
    brand: '',
    tags: '',
    minStockAlert: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [treeRes, codesRes] = await Promise.all([
          categoriesApi.getTree(),
          codeRegistryApi.getAll(),
        ]);
        const leaves = flattenLeafCategories(treeRes.data.data ?? []);
        setLeafCategories(leaves);
        setAllCodes(codesRes.data.data ?? []);
      } catch (e: any) {
        toast.error(e.message);
      }
    }
    load();
  }, []);

  const updateSkuPreview = useCallback(async (
    categoryId: number,
    schema: AttributeSchemaItem[],
    attrValues: Record<string, string>
  ) => {
    const attributes = schema
      .filter(s => attrValues[s.attributeType] && attrValues[s.attributeType] !== '__skip__')
      .map(s => ({ attributeType: s.attributeType, code: attrValues[s.attributeType] }));

    setSkuLoading(true);
    setSkuError('');
    try {
      const res = await skuEngineApi.preview(categoryId, attributes);
      setSkuPreview(res.data.data?.sku ?? '');
      setSkuSegments(res.data.data?.segments ?? []);
    } catch (e: any) {
      setSkuPreview('');
      setSkuError(e.message);
    } finally {
      setSkuLoading(false);
    }
  }, []);

  function handleCategoryChange(categoryId: string) {
    const cat = leafCategories.find(c => c.id === parseInt(categoryId));
    setSelectedCategory(cat ?? null);
    setAttributeValues({});
    setSkuPreview('');
    setSkuSegments([]);
    setSkuError('');
  }

  function handleAttributeChange(attributeType: string, code: string) {
    const newValues = { ...attributeValues, [attributeType]: code };
    setAttributeValues(newValues);
    if (selectedCategory) {
      updateSkuPreview(selectedCategory.id, selectedCategory.attributeSchema ?? [], newValues);
    }
  }

  function getCodesForType(attributeType: string): CodeRegistry[] {
    return allCodes.filter(c => c.type === attributeType && c.isActive);
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error('Product title is required'); return; }
    if (!selectedCategory) { toast.error('Please select a category'); return; }
    if (!skuPreview) { toast.error('SKU could not be generated. Fill all required attributes.'); return; }

    const attributes: ProductAttributeValue[] = (selectedCategory.attributeSchema ?? [])
      .filter(s => attributeValues[s.attributeType] && attributeValues[s.attributeType] !== '__skip__')
      .map(s => ({
        attributeType: s.attributeType,
        code: attributeValues[s.attributeType],
        label: allCodes.find(c => c.code === attributeValues[s.attributeType])?.label,
      }));

    setSaving(true);
    try {
      await productsApi.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        notes: form.notes.trim() || undefined,
        categoryId: selectedCategory.id,
        attributes,
        // extra fields passed as notes JSON for now until backend supports them
        ...(form.mrp || form.sellingPrice || form.hsnCode ? {
          notes: [
            form.notes.trim(),
            form.mrp ? `MRP: ₹${form.mrp}` : '',
            form.sellingPrice ? `Selling Price: ₹${form.sellingPrice}` : '',
            form.costPrice ? `Cost Price: ₹${form.costPrice}` : '',
            form.unit ? `Unit: ${form.unit}` : '',
            form.hsnCode ? `HSN: ${form.hsnCode}` : '',
            form.gstRate ? `GST: ${form.gstRate}%` : '',
            form.brand ? `Brand: ${form.brand}` : '',
            form.tags ? `Tags: ${form.tags}` : '',
            form.minStockAlert ? `Min Stock Alert: ${form.minStockAlert}` : '',
          ].filter(Boolean).join(' | '),
        } : {}),
      });
      toast.success(`Product saved with SKU: ${skuPreview}`);
      router.push('/products');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const schema = selectedCategory?.attributeSchema?.slice().sort((a, b) => a.order - b.order) ?? [];
  const requiredFilled = schema.filter(s => s.isRequired).every(s => !!attributeValues[s.attributeType]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Add New Product"
        description="Fill in product details. SKU is generated automatically from category + attributes."
        action={
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="col-span-2 space-y-5">

          {/* ── 1. Basic Info ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Product Title *</Label>
                <Input
                  placeholder="e.g. Silk Red Daily Poshak Size 3"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Detailed product description for catalog / listing..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Brand / Maker</Label>
                <Input
                  placeholder="e.g. VGS Pooja Bhandar, Local Artisan"
                  value={form.brand}
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tags
                  <span className="ml-2 font-normal text-xs text-muted-foreground">comma separated</span>
                </Label>
                <Input
                  placeholder="e.g. laddu gopal, poshak, silk, festival"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── 2. Pricing ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Pricing & Tax</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>MRP (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 299"
                    value={form.mrp}
                    onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Selling Price (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 249"
                    value={form.sellingPrice}
                    onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cost / Purchase Price (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 180"
                    value={form.costPrice}
                    onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>HSN Code</Label>
                  <Input
                    placeholder="e.g. 63079090"
                    value={form.hsnCode}
                    onChange={e => setForm(f => ({ ...f, hsnCode: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Required for GST billing</p>
                </div>
                <div className="space-y-1.5">
                  <Label>GST Rate (%)</Label>
                  <Select value={form.gstRate} onValueChange={v => setForm(f => ({ ...f, gstRate: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select GST %" />
                    </SelectTrigger>
                    <SelectContent>
                      {['0', '5', '12', '18', '28'].map(r => (
                        <SelectItem key={r} value={r}>{r}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Unit of Measure</Label>
                  <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['PCS', 'SET', 'PAIR', 'PKT', 'GM', 'KG', 'MTR', 'BOX'].map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── 3. Category ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Category *</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a leaf category..." />
                </SelectTrigger>
                <SelectContent>
                  {leafCategories.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                      <span className="ml-2 font-mono text-xs text-muted-foreground">({c.code})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <p className="text-xs text-muted-foreground mt-2">
                  Leaf category selected. Fill attributes below to generate SKU.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── 4. Dynamic Attributes ── */}
          {selectedCategory && schema.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Attributes
                  <span className="ml-2 font-normal text-xs text-muted-foreground">
                    — defines the SKU segments
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {schema.map((schemaItem) => {
                  const codesForType = getCodesForType(schemaItem.attributeType);
                  const selectedCode = allCodes.find(c => c.code === attributeValues[schemaItem.attributeType]);
                  return (
                    <div key={schemaItem.attributeType} className="space-y-1.5">
                      <Label>
                        {schemaItem.attributeLabel}
                        {schemaItem.isRequired && <span className="text-destructive ml-1">*</span>}
                        <span className="ml-2 text-xs text-muted-foreground font-normal">({schemaItem.attributeType})</span>
                      </Label>
                      <Select
                        value={attributeValues[schemaItem.attributeType] ?? ''}
                        onValueChange={v => handleAttributeChange(schemaItem.attributeType, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            schemaItem.isRequired
                              ? 'Required — select a value'
                              : `Optional (uses "${schemaItem.placeholderCode}" if skipped)`
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {!schemaItem.isRequired && (
                            <SelectItem value="__skip__">⟵ Skip (use placeholder)</SelectItem>
                          )}
                          {codesForType.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                              No codes of type <strong>{schemaItem.attributeType}</strong> found.
                              <br />Go to Code Registry and add them first.
                            </div>
                          ) : (
                            codesForType.map(c => (
                              <SelectItem key={c.id} value={c.code}>
                                {c.label}
                                <span className="ml-2 font-mono text-xs text-muted-foreground">{c.code}</span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedCode && (
                        <p className="text-xs text-muted-foreground">{selectedCode.description}</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* ── 5. Inventory & Internal ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Inventory & Internal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Min Stock Alert Qty</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5 — get alert when stock drops below this"
                  value={form.minStockAlert}
                  onChange={e => setForm(f => ({ ...f, minStockAlert: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Internal Notes</Label>
                <Input
                  placeholder="Notes visible only to your team..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN: SKU Preview (sticky) ── */}
        <div className="space-y-4">
          <div className="sticky top-6 space-y-3">

            {/* SKU Card */}
            <Card className={cn(
              'border-2 transition-colors',
              skuPreview ? 'border-primary/40 bg-primary/5' : 'border-border'
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  SKU Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skuLoading ? (
                  <p className="text-sm text-muted-foreground animate-pulse">Generating...</p>
                ) : skuError ? (
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{skuError}</p>
                  </div>
                ) : skuPreview ? (
                  <>
                    <code className="text-lg font-bold font-mono text-primary block mb-3 break-all">
                      {skuPreview}
                    </code>
                    <div className="flex flex-wrap gap-1.5">
                      {skuSegments.map((seg, i) => (
                        <span key={i} className="text-xs bg-background border border-border px-2 py-0.5 rounded font-mono">
                          {seg.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a category and fill attributes to preview SKU.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Readiness Checklist */}
            <Card>
              <CardContent className="pt-4 space-y-2">
                {([
                  { label: 'Title', ok: !!form.title.trim() },
                  { label: 'Category', ok: !!selectedCategory },
                  { label: 'Required Attributes', ok: requiredFilled },
                  { label: 'SKU Generated', ok: !!skuPreview },
                ] as { label: string; ok: boolean }[]).map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className={cn('h-3.5 w-3.5 shrink-0', item.ok ? 'text-green-500' : 'text-muted-foreground/40')} />
                    <span className={item.ok ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Separator />

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={saving || !skuPreview || !form.title.trim()}
            >
              {saving ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
