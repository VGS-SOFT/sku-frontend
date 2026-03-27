'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ChevronRight, FolderTree } from 'lucide-react';
import { mastersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const schema = z.object({
  name:      z.string().min(2, 'Min 2 characters'),
  code:      z.string().regex(/^[A-Z0-9]{2,6}$/, '2-6 uppercase alphanumeric (e.g. LG)'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function MastersPage() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: masters = [], isLoading } = useQuery({
    queryKey: ['masters'],
    queryFn:  () => mastersApi.list().then(r => r.data),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: (d: FormData) => mastersApi.create(d),
    onSuccess: () => { toast.success('Master created'); qc.invalidateQueries({ queryKey: ['masters'] }); reset(); setShowForm(false); },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => mastersApi.update(id, data),
    onSuccess: () => { toast.success('Master updated'); qc.invalidateQueries({ queryKey: ['masters'] }); reset(); setEditId(null); setShowForm(false); },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => mastersApi.remove(id),
    onSuccess: () => { toast.success('Master deleted'); qc.invalidateQueries({ queryKey: ['masters'] }); },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const onSubmit = (data: FormData) => {
    if (editId) updateMut.mutate({ id: editId, data });
    else createMut.mutate(data);
  };

  const startEdit = (m: any) => {
    setValue('name', m.name); setValue('code', m.code); setValue('description', m.description || '');
    setEditId(m.id); setShowForm(true);
  };

  const cancelForm = () => { reset(); setEditId(null); setShowForm(false); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-950">Master Categories</h2>
          <p className="text-sm text-gray-500 mt-0.5">Top-level groupings. Each contains its own category tree.</p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Add master
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editId ? 'Edit master' : 'New master category'}</CardTitle>
            <CardDescription>Give it a short memorable code like LG, PS, KR</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input label="Name" placeholder="Laddu Gopal ji" error={errors.name?.message} {...register('name')} />
              <Input label="Code" placeholder="LG" className="uppercase" error={errors.code?.message}
                {...register('code', { onChange: e => { e.target.value = e.target.value.toUpperCase(); } })} />
              <Input label="Description (optional)" placeholder="Brief description" {...register('description')} />
              <div className="flex gap-2 sm:col-span-3">
                <Button type="submit" size="sm" isLoading={isSubmitting}>
                  {editId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={cancelForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
        </div>
      ) : masters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderTree className="h-8 w-8 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-900">No master categories yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first master category to get started</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-gray-50">
            {masters.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
                    <FolderTree className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    {m.description && <p className="text-xs text-gray-400">{m.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">{m.code}</Badge>
                  <Badge variant="secondary">{m._count?.categories ?? 0} categories</Badge>
                  <button onClick={() => startEdit(m)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${m.name}"?`)) deleteMut.mutate(m.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
