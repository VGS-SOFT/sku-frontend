'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Lock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { codeRegistryApi } from '@/lib/api';
import { CodeRegistry, CodeType, CreateCodeRegistryForm } from '@/lib/types';
import { cn, CODE_TYPE_COLORS, formatDate } from '@/lib/utils';

const CODE_TYPES: CodeType[] = [
  'CATEGORY', 'MATERIAL', 'PRODUCT_TYPE',
  'COLOR', 'STYLE', 'FINISH', 'SIZE', 'CUSTOM',
];

// Human-readable description for each type — shown as hint when CUSTOM is selected
const CODE_TYPE_HINTS: Record<string, string> = {
  CATEGORY: 'Use for top-level or sub product categories (e.g. Vagha, Idol).',
  MATERIAL: 'Use for raw material type (e.g. Silk, Brass, Marble, Cotton).',
  PRODUCT_TYPE: 'Use for product type classification within a category.',
  COLOR: 'Use for color variants (e.g. Red, Golden, White).',
  STYLE: 'Use for occasion / style tags (e.g. Daily, Festival, Winter).',
  FINISH: 'Use for surface finish (e.g. Gold Polish, Matte, Minakari).',
  SIZE: 'Use for size variants — idol numbers (s1-s6), chowki sizes, pack weights.',
  CUSTOM: 'Use for any dimension that does not fit standard types above. Example: Scent, Packaging, Shape, Weight class, Brand, etc.',
};

const EMPTY_FORM: CreateCodeRegistryForm = {
  label: '', code: '', type: 'CUSTOM', description: '',
};

export default function CodeRegistryPage() {
  const [codes, setCodes] = useState<CodeRegistry[]>([]);
  const [filtered, setFiltered] = useState<CodeRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CodeRegistry | null>(null);
  const [form, setForm] = useState<CreateCodeRegistryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await codeRegistryApi.getAll();
      setCodes(res.data.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  useEffect(() => {
    let result = codes;
    if (typeFilter !== 'ALL') result = result.filter(c => c.type === typeFilter);
    if (search) result = result.filter(c =>
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [codes, search, typeFilter]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(code: CodeRegistry) {
    setEditTarget(code);
    setForm({ label: code.label, code: code.code, type: code.type, description: code.description ?? '' });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.label || !form.code || !form.type) {
      toast.error('Label, code and type are required');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await codeRegistryApi.update(editTarget.id, { label: form.label, description: form.description });
        toast.success('Code updated successfully');
      } else {
        await codeRegistryApi.create(form);
        toast.success(`Code "${form.code}" registered successfully`);
      }
      setDialogOpen(false);
      fetchCodes();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(code: CodeRegistry) {
    if (code.isUsed) {
      toast.error(`Cannot delete "${code.code}" — it is already used in a SKU. Deactivate instead.`);
      return;
    }
    if (!confirm(`Delete code "${code.code}"? This cannot be undone.`)) return;
    try {
      await codeRegistryApi.remove(code.id);
      toast.success('Code deleted');
      fetchCodes();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Code Registry"
        description="Manage all short code mappings. Codes are globally unique and immutable once used in a SKU."
        action={
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4" /> Add Code
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search label or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {CODE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No codes found.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add your first code
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Label', 'Code', 'Type', 'Status', 'Created', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((code) => (
                  <tr key={code.id} className={cn('border-b border-border last:border-0 hover:bg-muted/30 transition-colors', !code.isActive && 'opacity-50')}>
                    <td className="px-4 py-3 text-sm font-medium">{code.label}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{code.code}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-md border font-medium', CODE_TYPE_COLORS[code.type])}>
                        {code.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {code.isUsed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <Lock className="h-3 w-3" /> In Use
                        </span>
                      ) : (
                        <span className="text-xs text-green-600">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(code.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(code)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => handleDelete(code)}
                          disabled={code.isUsed}
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Code' : 'Register New Code'}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? 'Only label and description can be changed. Code and type are immutable.'
                : 'Code must be lowercase alphanumeric, globally unique.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Label */}
            <div className="space-y-1.5">
              <Label>Label *</Label>
              <Input
                placeholder="e.g. White Color"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>

            {/* Short Code */}
            <div className="space-y-1.5">
              <Label>Short Code *</Label>
              <Input
                placeholder="e.g. whtclr"
                value={form.code}
                disabled={!!editTarget}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Lowercase letters and numbers only. Cannot be changed after creation.</p>
            </div>

            {/* Type — only on create */}
            {!editTarget && (
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm(f => ({ ...f, type: v as CodeType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CODE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Type hint — always visible, especially useful for CUSTOM */}
                <p className="text-xs text-muted-foreground bg-muted/50 border border-border rounded px-3 py-2 leading-relaxed">
                  {CODE_TYPE_HINTS[form.type] ?? ''}
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description
                {form.type === 'CUSTOM' && !editTarget && (
                  <span className="ml-1 text-xs text-amber-600 font-normal">(recommended for CUSTOM types)</span>
                )}
              </Label>
              <Textarea
                placeholder={
                  form.type === 'CUSTOM'
                    ? 'Describe what this CUSTOM code represents. e.g. "Scent type for agarbatti — used in SKU segment position 4"'
                    : 'Optional notes about this code...'
                }
                value={form.description ?? ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={form.type === 'CUSTOM' ? 3 : 2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Register Code'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
