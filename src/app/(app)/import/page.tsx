'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ImportPage() {
  const [text,    setText]    = useState('');
  const [results, setResults] = useState<any[]>([]);

  const previewMut = useMutation({
    mutationFn: (rows: string[]) => api.post('/import/bulk-preview', { rows: rows.map(r => ({ productName: r })) }).then(r => r.data),
    onSuccess: (data) => {
      setResults(data.results);
      toast.success(`Previewed ${data.total} rows`);
    },
    onError: () => toast.error('Preview failed'),
  });

  const handlePreview = () => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { toast.error('Enter at least one product name'); return; }
    previewMut.mutate(lines);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-950">Bulk Import</h2>
        <p className="text-sm text-gray-500 mt-0.5">Paste product names and the engine auto-maps categories and assigns SKUs.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Paste product list</CardTitle>
            <CardDescription>One product name per line.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="flex min-h-[220px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 resize-none"
              placeholder={`Transparent Poshak\nBrass Bansuri\nGolden Sinhasan Size 2\u2026`}
              value={text} onChange={e => setText(e.target.value)}
            />
            <Button onClick={handlePreview} isLoading={previewMut.isPending} className="w-full">
              <Upload className="h-3.5 w-3.5" /> Preview mapping
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview results</CardTitle>
            <CardDescription>{results.length} rows mapped</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Upload className="h-8 w-8 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Results will appear here after preview</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm text-gray-900">{r.input.productName}</p>
                      {r.categoryResolved?.name && (
                        <p className="text-xs text-gray-400">→ {r.categoryResolved.name}</p>
                      )}
                    </div>
                    <Badge variant={r.status === 'ready' ? 'success' : 'warning'}>
                      {r.status === 'ready' ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      <span className="ml-1">{r.status === 'ready' ? 'Ready' : 'Review'}</span>
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
