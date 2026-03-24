'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ChevronRight, FolderOpen, Folder, ListOrdered } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { categoriesApi } from '@/lib/api';
import { Category, CreateCategoryForm, AttributeSchemaItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const ATTRIBUTE_TYPES = ['MATERIAL', 'PRODUCT_TYPE', 'COLOR', 'STYLE', 'FINISH', 'SIZE', 'CUSTOM'];

const EMPTY_FORM: CreateCategoryForm = {
  name: '', code: '', description: '', parentId: undefined, isLeaf: false, attributeSchema: [],
};

function CategoryTreeNode({
  category, depth = 0, onEdit, onDelete, onAddChild,
}: {
  category: Category;
  depth?: number;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddChild: (parent: Category) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 group transition-colors',
          depth > 0 && 'ml-5'
        )}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 text-muted-foreground"
        >
          {hasChildren ? (
            <ChevronRight className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')} />
          ) : (
            <span className="w-4 h-4 block" />
          )}
        </button>

        {category.isLeaf ? (
          <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-blue-500 shrink-0" />
        )}

        <span className="text-sm font-medium flex-1">{category.name}</span>
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
          {category.code}
        </code>

        {category.isLeaf && (
          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded">
            LEAF
          </span>
        )}

        {/* Actions - visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!category.isLeaf && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(category)}>
              <Plus className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(category)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 hover:text-destructive"
            onClick={() => onDelete(category)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {category.children!.map(child => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [tree, setTree] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<CreateCategoryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, allRes] = await Promise.all([
        categoriesApi.getTree(),
        categoriesApi.getAll(),
      ]);
      setTree(treeRes.data.data ?? []);
      setAllCategories(allRes.data.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  function openCreate(parent?: Category) {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, parentId: parent?.id });
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditTarget(category);
    setForm({
      name: category.name,
      code: category.code,
      description: category.description ?? '',
      parentId: category.parentId,
      isLeaf: category.isLeaf,
      attributeSchema: category.attributeSchema ?? [],
    });
    setDialogOpen(true);
  }

  function addSchemaRow() {
    setForm(f => ({
      ...f,
      attributeSchema: [
        ...(f.attributeSchema ?? []),
        { attributeType: 'COLOR', attributeLabel: '', order: (f.attributeSchema?.length ?? 0) + 1, isRequired: true, placeholderCode: 'na' },
      ],
    }));
  }

  function updateSchemaRow(index: number, partial: Partial<AttributeSchemaItem>) {
    setForm(f => ({
      ...f,
      attributeSchema: (f.attributeSchema ?? []).map((row, i) => i === index ? { ...row, ...partial } : row),
    }));
  }

  function removeSchemaRow(index: number) {
    setForm(f => ({
      ...f,
      attributeSchema: (f.attributeSchema ?? []).filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    if (!form.name || !form.code) { toast.error('Name and code are required'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await categoriesApi.update(editTarget.id, form);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(form);
        toast.success(`Category "${form.name}" created`);
      }
      setDialogOpen(false);
      fetchTree();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Delete "${category.name}"?`)) return;
    try {
      await categoriesApi.remove(category.id);
      toast.success('Category deleted');
      fetchTree();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  // Flatten all categories for parent dropdown
  function flattenCategories(cats: Category[]): Category[] {
    return cats.reduce<Category[]>((acc, c) => [
      ...acc, c, ...(c.children ? flattenCategories(c.children) : [])
    ], []);
  }
  const flatCats = flattenCategories(tree).filter(c => !c.isLeaf);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Categories"
        description="Build your N-level product category hierarchy. Leaf categories hold the attribute schema."
        action={
          <Button onClick={() => openCreate()} size="sm">
            <Plus className="h-4 w-4" /> Add Root Category
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>
          ) : tree.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No categories yet.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => openCreate()}>
                <Plus className="h-4 w-4" /> Create first category
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {tree.map(cat => (
                <CategoryTreeNode
                  key={cat.id}
                  category={cat}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onAddChild={(parent) => openCreate(parent)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Category' : 'Create Category'}</DialogTitle>
            <DialogDescription>
              {form.isLeaf ? 'Leaf category — define the attribute schema for SKU generation.' : 'Parent category — can have sub-categories.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  placeholder="e.g. Cotton Vastra"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Short Code *</Label>
                <Input
                  placeholder="e.g. ctnvst"
                  value={form.code}
                  disabled={!!editTarget}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Parent Category</Label>
              <Select
                value={form.parentId?.toString() ?? 'none'}
                onValueChange={v => setForm(f => ({ ...f, parentId: v === 'none' ? undefined : parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (root category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (root category)</SelectItem>
                  {flatCats.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLeaf"
                checked={form.isLeaf}
                onChange={e => setForm(f => ({ ...f, isLeaf: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isLeaf" className="cursor-pointer">
                This is a leaf category (products are assigned here)
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                value={form.description ?? ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Attribute Schema - only for leaf */}
            {form.isLeaf && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ListOrdered className="h-4 w-4 text-muted-foreground" />
                      <Label>Attribute Schema</Label>
                    </div>
                    <Button variant="outline" size="sm" onClick={addSchemaRow}>
                      <Plus className="h-3.5 w-3.5" /> Add Attribute
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Define which attributes products in this category need, and in what order they appear in the SKU.
                  </p>

                  {(form.attributeSchema ?? []).length === 0 ? (
                    <div className="border border-dashed border-border rounded-lg py-6 text-center">
                      <p className="text-sm text-muted-foreground">No attributes yet. Add at least one.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(form.attributeSchema ?? []).map((row, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                          <span className="text-xs text-muted-foreground w-5 text-center font-mono">{row.order}</span>
                          <Select
                            value={row.attributeType}
                            onValueChange={v => updateSchemaRow(i, { attributeType: v })}
                          >
                            <SelectTrigger className="w-36 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ATTRIBUTE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Label (e.g. Color)"
                            value={row.attributeLabel}
                            onChange={e => updateSchemaRow(i, { attributeLabel: e.target.value })}
                            className="flex-1 h-8 text-xs"
                          />
                          <Input
                            placeholder="placeholder"
                            value={row.placeholderCode ?? 'na'}
                            onChange={e => updateSchemaRow(i, { placeholderCode: e.target.value })}
                            className="w-20 h-8 text-xs font-mono"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={row.isRequired}
                              onChange={e => updateSchemaRow(i, { isRequired: e.target.checked })}
                              className="h-3.5 w-3.5"
                            />
                            <span className="text-xs text-muted-foreground">Req</span>
                          </div>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => removeSchemaRow(i)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
