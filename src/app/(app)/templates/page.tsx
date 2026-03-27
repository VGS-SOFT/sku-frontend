'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookTemplate, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function TemplatesPage() {
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn:  () => api.get('/templates').then(r => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/templates/${id}`),
    onSuccess: () => { toast.success('Template deleted'); qc.invalidateQueries({ queryKey: ['templates'] }); },
    onError:   () => toast.error('Failed to delete'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-950">Templates</h2>
        <p className="text-sm text-gray-500 mt-0.5">Saved SKU configurations for quick re-use.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
        </div>
      ) : templates.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16 text-center">
          <BookTemplate className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-900">No templates saved yet</p>
          <p className="text-xs text-gray-400 mt-1">Save a SKU configuration as a template from the generator.</p>
          <Link href="/skus" className="mt-4 text-xs font-medium text-gray-700 hover:text-black underline underline-offset-4 transition-colors">
            Go to SKU Generator →
          </Link>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t: any) => (
            <Card key={t.id} className="group cursor-pointer hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{t.name}</p>
                    {t.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.description}</p>}
                    <p className="text-[10px] text-gray-300 mt-2">{formatDate(t.createdAt)}</p>
                  </div>
                  <button onClick={() => { if (confirm('Delete this template?')) deleteMut.mutate(t.id); }}
                    className="ml-2 p-1 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="secondary">Saved config</Badge>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
