'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, ChevronRight, Tags, Pencil, Trash2 } from 'lucide-react';
import { categoriesApi, mastersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const schema = z.object({
  name:      z.string().min(1, 'Required'),
  code:      z.string().regex(/^[A-Z0-9]{2,8}$/, '2-8 uppercase alphanumeric'),
  masterId:  z.coerce.number().min(1, 'Select a master'),
  parentId:  z.coerce.number().optional(),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function CategoryNode({ cat, depth = 0, onEdit, onDelete }: { cat: any; depth?: number; onEdit: (c: any) => void; onDelete: (c: any) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <div
        className={cn(
          'flex items-center justify-between py-3 pr-4 hover:bg-gray-50 rounded-lg transition-colors',
          depth > 0 && 'ml-6 border-l border-gray-100 pl-4',
        )}
      >
        <div className="flex items-center gap-2">
          {cat.children?.length > 0 && (
            <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600">
              <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />
            </button>
          )}
          {!cat.children?.length && <span className="w-5" />}
          <span className="text-sm text-gray-900">{cat.name}</span>
          <Badge variant="outline" className="font-mono text-[10px]">{cat.code}</Badge>
          {cat.depth !== undefined && <Badge variant="secondary" className="text-[10px]">L{cat.depth + 1}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(cat)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={() => onDelete(cat)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {open && cat.children?.map((child: any) => (
        <CategoryNode key={child.id} cat={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]   = useState<number | null>(null);

  const { data: masters  = [] } = useQuery({ queryKey: ['masters'],    queryFn: () => mastersApi.list().then(r => r.data) });
  const { data: treeData = [], isLoading } = useQuery({ queryKey: ['categories-tree'], queryFn: () => categoriesApi.tree().then(r => r.data) });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: (d: FormData) => categoriesApi.create({ ...d, parentId: d.parentId || undefined }),
    onSuccess: () => { toast.success('Category created'); qc.invalidateQueries({ queryKey: ['categories-tree'] }); reset(); setShowForm(false); },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => categoriesApi.update(id, data),
    onSuccess: () => { toast.success('Category updated'); qc.invalidateQueries({ queryKey: ['categories-tree'] }); reset(); setEditId(null); setShowForm(false); },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => { toast.success('Category deleted'); qc.invalidateQueries({ queryKey: ['categories-tree'] }); },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const onSubmit = (data: FormData) => {
    if (editId) updateMut.mutate({ id: editId, data: { name: data.name, code: data.code, description: data.description } });
    else createMut.mutate(data);
  };

  const startEdit = (cat: any) => {
    setValue('name', cat.name); setValue('code', cat.code);
    setValue('masterId', cat.masterId); setValue('parentId', cat.parentId ?? undefined);
    setEditId(cat.id); setShowForm(true);
  };

  const handleDelete = (cat: any) => {
    if (confirm(`Delete "${cat.name}" and all its sub-categories?`)) deleteMut.mutate(cat.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-950">Categories</h2>
          <p className="text-sm text-gray-500 mt-0.5">Build N-level deep category trees under each master.</p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Add category
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editId ? 'Edit category' : 'New category'}</CardTitle>
            <CardDescription>Set the master and optionally a parent category.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Master *</label>
                <select className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  {...register('masterId')}>
                  <option value="">Select master</option>
                  {masters.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                </select>
                {errors.masterId && <p className="text-xs text-red-500">{errors.masterId.message}</p>}
              </div>
              <Input label="Name" placeholder="Poshak" error={errors.name?.message} {...register('name')} />
              <Input label="Code" placeholder="PSK" error={errors.code?.message}
                {...register('code', { onChange: e => { e.target.value = e.target.value.toUpperCase(); } })} />
              <Input label="Description (optional)" placeholder="Optional" {...register('description')} />
              <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
                <Button type="submit" size="sm" isLoading={isSubmitting}>{editId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { reset(); setEditId(null); setShowForm(false); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
        </div>
      ) : treeData.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-center">
          <Tags className="h-8 w-8 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-900">No categories yet</p>
          <p className="text-xs text-gray-400 mt-1">First create a master category, then add categories under it.</p>
        </CardContent></Card>
      ) : treeData.map((master: any) => (
        <Card key={master.id}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{master.name}</CardTitle>
              <Badge variant="outline" className="font-mono">{master.code}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {master.children?.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No categories under this master yet.</p>
            ) : master.children?.map((cat: any) => (
              <CategoryNode key={cat.id} cat={cat} onEdit={startEdit} onDelete={handleDelete} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
