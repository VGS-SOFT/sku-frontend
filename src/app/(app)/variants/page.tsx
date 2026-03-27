'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Layers } from 'lucide-react';
import { variantsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const typeSchema = z.object({ name: z.string().min(2), description: z.string().optional() });
const valSchema  = z.object({
  name: z.string().min(1),
  code: z.string().regex(/^[A-Z0-9]{1,8}$/, '1-8 uppercase alphanumeric'),
  description: z.string().optional(),
});
type TypeForm = z.infer<typeof typeSchema>;
type ValForm  = z.infer<typeof valSchema>;

export default function VariantsPage() {
  const qc = useQueryClient();
  const [openTypeId, setOpenTypeId] = useState<number | null>(null);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [addingValTo, setAddingValTo]   = useState<number | null>(null);

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['varTypes'],
    queryFn:  () => variantsApi.listTypes().then(r => r.data),
  });

  const typeForm = useForm<TypeForm>({ resolver: zodResolver(typeSchema) });
  const valForm  = useForm<ValForm>({ resolver: zodResolver(valSchema) });

  const createTypeMut = useMutation({
    mutationFn: (d: TypeForm) => variantsApi.createType(d),
    onSuccess: () => { toast.success('Variant type created'); qc.invalidateQueries({ queryKey: ['varTypes'] }); typeForm.reset(); setShowTypeForm(false); },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteTypeMut = useMutation({
    mutationFn: (id: number) => variantsApi.deleteType(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['varTypes'] }); },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const createValMut = useMutation({
    mutationFn: ({ typeId, data }: { typeId: number; data: ValForm }) => variantsApi.createValue(typeId, data),
    onSuccess: () => { toast.success('Value added'); qc.invalidateQueries({ queryKey: ['varTypes'] }); valForm.reset(); setAddingValTo(null); },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteValMut = useMutation({
    mutationFn: (id: number) => variantsApi.deleteValue(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['varTypes'] }); },
    onError:   (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-950">Variants</h2>
          <p className="text-sm text-gray-500 mt-0.5">Define variant axes (Color, Size, Material…) and their values.</p>
        </div>
        <Button size="sm" onClick={() => setShowTypeForm(true)}>
          <Plus className="h-3.5 w-3.5" /> Add variant type
        </Button>
      </div>

      {showTypeForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={typeForm.handleSubmit(d => createTypeMut.mutate(d))} className="flex items-end gap-3">
              <Input label="Type name" placeholder="e.g. Color, Size, Material" className="flex-1"
                error={typeForm.formState.errors.name?.message} {...typeForm.register('name')} />
              <Input label="Description (optional)" placeholder="Optional" className="flex-1" {...typeForm.register('description')} />
              <div className="flex gap-2 pb-px">
                <Button size="sm" isLoading={typeForm.formState.isSubmitting}>Create</Button>
                <Button size="sm" variant="outline" type="button" onClick={() => { typeForm.reset(); setShowTypeForm(false); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
        </div>
      ) : types.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-center">
          <Layers className="h-8 w-8 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-900">No variant types yet</p>
        </CardContent></Card>
      ) : types.map((t: any) => (
        <Card key={t.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setOpenTypeId(openTypeId === t.id ? null : t.id)}>
                {openTypeId === t.id ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                <CardTitle>{t.name}</CardTitle>
                <Badge variant="secondary">{t.values?.length ?? 0} values</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => setAddingValTo(addingValTo === t.id ? null : t.id)}>
                  <Plus className="h-3 w-3" /> Add value
                </Button>
                <button onClick={() => { if (confirm(`Delete type "${t.name}"?`)) deleteTypeMut.mutate(t.id); }}
                  className="ml-1 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </CardHeader>

          {openTypeId === t.id && (
            <CardContent>
              {addingValTo === t.id && (
                <form onSubmit={valForm.handleSubmit(d => createValMut.mutate({ typeId: t.id, data: d }))}
                  className="mb-4 flex items-end gap-3 rounded-lg border border-dashed border-gray-200 p-4">
                  <Input label="Name" placeholder="e.g. Brass" className="flex-1"
                    error={valForm.formState.errors.name?.message} {...valForm.register('name')} />
                  <Input label="Code" placeholder="BRS" className="w-28"
                    error={valForm.formState.errors.code?.message}
                    {...valForm.register('code', { onChange: e => { e.target.value = e.target.value.toUpperCase(); } })} />
                  <div className="flex gap-2 pb-px">
                    <Button size="sm" isLoading={valForm.formState.isSubmitting}>Add</Button>
                    <Button size="sm" variant="outline" type="button" onClick={() => { valForm.reset(); setAddingValTo(null); }}>Cancel</Button>
                  </div>
                </form>
              )}
              <div className="flex flex-wrap gap-2">
                {t.values?.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm">
                    <span className="text-gray-900">{v.name}</span>
                    <span className="font-mono text-xs text-gray-400">{v.code}</span>
                    <button onClick={() => { if (confirm(`Delete "${v.name}"?`)) deleteValMut.mutate(v.id); }}
                      className="ml-1 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {t.values?.length === 0 && <p className="text-xs text-gray-400">No values yet — add one above.</p>}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
