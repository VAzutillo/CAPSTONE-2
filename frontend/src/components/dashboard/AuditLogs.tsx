import React, { useEffect, useState } from 'react';
import { Shield, Clock, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

import { API_BASE_URL } from '../../config';

export function AuditLogs() {
  const [logs, setLogs] = useState<{ id: string; action: string; user: string; details: string; time: string; status: string }[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const params = search ? new URLSearchParams({ search, limit: '50' }) : new URLSearchParams({ limit: '50' });
        const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs?${params}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load logs');
        setLogs((data.logs || []).map((l: any) => ({
          id: l.id,
          action: l.action,
          user: l.user,
          details: l.details,
          time: l.time ? (typeof l.time === 'string' ? l.time : new Date(l.time).toLocaleString()) : '',
          status: l.status,
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load logs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [search]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Audit Logs</h1>
        <p className="text-neutral-500">Track system activity and user actions.</p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input placeholder="Search logs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {error && <p className="px-4 text-sm text-red-600">{error}</p>}
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Details</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No logs found.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-neutral-900">{log.action}</td>
                  <td className="px-6 py-4 text-neutral-600">{log.user}</td>
                  <td className="px-6 py-4 text-neutral-600 max-w-xs truncate" title={log.details}>{log.details}</td>
                  <td className="px-6 py-4 text-neutral-500 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.time}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant="outline" className={
                      log.status === 'Success' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                      log.status === 'Warning' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                      'border-red-200 text-red-700 bg-red-50'
                    }>
                      {log.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
