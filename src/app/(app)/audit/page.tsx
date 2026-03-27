'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { auditApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const actionColors: Record<string, any> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'destructive',
};

export default function AuditPage() {
  const [entityType, setEntityType] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit', entityType],
    queryFn:  () => auditApi.list({ entityType: entityType || undefined, limit: 100 }).then(r => r.data),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-950">Audit Logs</h2>
          <p className="text-sm text-gray-500 mt-0.5">System activity history — admin only.</p>
        </div>
        <select
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus-visible:outline-none"
          value={entityType} onChange={e => setEntityType(e.target.value)}
        >
          <option value="">All entities</option>
          {['sku', 'category', 'master', 'variant_type', 'variant_value', 'template'].map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <ClipboardList className="h-8 w-8 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-900">No audit logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Action', 'Entity', 'Entity ID', 'User', 'Changes', 'Time'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Badge variant={actionColors[l.action] ?? 'secondary'}>{l.action}</Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{l.entityType}</td>
                    <td className="px-5 py-3 text-gray-500">#{l.entityId}</td>
                    <td className="px-5 py-3 text-gray-700">{l.user?.name ?? '—'}</td>
                    <td className="px-5 py-3 max-w-[200px]">
                      <pre className="truncate text-[10px] text-gray-400">{JSON.stringify(l.changes).slice(0, 60)}…</pre>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{formatDate(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
