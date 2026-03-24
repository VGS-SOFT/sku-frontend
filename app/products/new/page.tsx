'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
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

// Flatten tree to list of leaf categories only
function flattenLeafCategories(cats: Category[]): Category[] {
  return cats.reduce<Category[]>((acc, c) => {
    if (c.isLeaf) return [...acc, c];
    return [...acc, ...(c.children ? flattenLeafCategories(c.children) : [])];
  }, []);
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
    title: '', description: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Load initial data
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

  // Auto-generate SKU preview whenever category or attributes change
  const updateSkuPreview = useCallback(async (
    categoryId: number,
    schema: AttributeSchemaItem[],
    attrValues: Record<string, string>
  ) => {
    // Build attributes array from current values
    const attributes = schema
      .filter(s => attrValues[s.attributeType])
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

  // Get codes filtered by attribute type
  function getCodesForType(attributeType: string): CodeRegistry[] {
    return allCodes.filter(c => c.type === attributeType && c.isActive);
  }

  async function handleSubmit() {
    if (!form.title) { toast.error('Product title is required'); return; }
    if (!selectedCategory) { toast.error('Please select a category'); return; }
    if (!skuPreview) { toast.error('SKU could not be generated. Check required attributes.'); return; }

    const attributes: ProductAttributeValue[] = (selectedCategory.attributeSchema ?? [])
      .filter(s => attributeValues[s.attributeType])
      .map(s => ({
        attributeType: s.attributeType,
        code: attributeValues[s.attributeType],
        label: allCodes.find(c => c.code === attributeValues[s.attributeType])?.label,
      }));

    setSaving(true);
    try {
      await productsApi.create({
        title: form.title,
        description: form.description,
        notes: form.notes,
        categoryId: selectedCategory.id,
        attributes,
      });
      toast.success(`Product added with SKU: ${skuPreview}`);
      router.push('/products');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const schema = selectedCategory?.attributeSchema?.slice().sort((a, b) => a.order - b.order) ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Add New Product"
        description="Fill in product details. SKU is generated automatically."
        action={
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="col-span-2 space-y-5">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Product Title *</Label>
                <Input
                  placeholder="e.g. White Cotton Vagha Size 4"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Optional product description..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Internal Notes</Label>
                <Input
                  placeholder="Notes for internal use only..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Selection */}
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
            </CardContent>
          </Card>

          {/* Dynamic Attributes */}
          {selectedCategory && schema.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {schema.map((schemaItem) => {
                  const codesForType = getCodesForType(schemaItem.attributeType);
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
                          <SelectValue placeholder={schemaItem.isRequired ? 'Required — select a value' : `Optional (uses "${schemaItem.placeholderCode}" if skipped)`} />
                        </SelectTrigger>
                        <SelectContent>
                          {!schemaItem.isRequired && (
                            <SelectItem value="__skip__">Skip (use placeholder)</SelectItem>
                          )}
                          {codesForType.length === 0 ? (
                            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                              No codes of type {schemaItem.attributeType} found.
                              <br />Add them in Code Registry first.
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
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: SKU Preview (sticky) */}
        <div className="space-y-4">
          <div className="sticky top-6">
            <Card className={cn(
              'border-2 transition-colors',
              skuPreview ? 'border-primary/30 bg-primary/5' : 'border-border'
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  SKU Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skuLoading ? (
                  <p className="text-sm text-muted-foreground">Generating...</p>
                ) : skuError ? (
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{skuError}</p>
                  </div>
                ) : skuPreview ? (
                  <>
                    <code className="text-lg font-bold font-mono text-primary block mb-3">
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
                    Select a category and fill attributes to preview the SKU.
                  </p>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full mt-3"
              onClick={handleSubmit}
              disabled={saving || !skuPreview}
            >
              {saving ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
