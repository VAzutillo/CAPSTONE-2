import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { API_BASE_URL } from '../../config';

type Entry = {
  id: string;
  block: string;
  courseName: string;
  schedule: string;
  room: string;
  assignedProfessorEmail: string;
  graceOverrideMinutes: number | null;
  order: number;
};

const emptyForm = {
  block: '',
  courseName: '',
  schedule: '',
  room: '',
  assignedProfessorEmail: '',
  graceOverrideMinutes: '' as string | number,
  order: 0,
};

export function MasterSchedule() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filterBlock, setFilterBlock] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const q = filterBlock.trim() ? `?block=${encodeURIComponent(filterBlock.trim())}` : '';
      const res = await fetch(`${API_BASE_URL}/api/admin/master-schedule${q}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load master schedule');
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterBlock]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        block: form.block.trim(),
        courseName: form.courseName.trim(),
        schedule: form.schedule.trim(),
        room: form.room.trim(),
        assignedProfessorEmail: form.assignedProfessorEmail.trim(),
        graceOverrideMinutes: form.graceOverrideMinutes === '' ? null : Number(form.graceOverrideMinutes),
        order: Number(form.order) || 0,
      };
      const res = await fetch(`${API_BASE_URL}/api/admin/master-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/master-schedule/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this row and re-sync student schedules for that block?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/master-schedule/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Master schedule</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Define official subjects, times, and rooms per block. Professors assigned here inherit rows; saving or syncing
          pushes the same list into every student&apos;s enrollment record for that block.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">{error}</div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add class offering</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ms-block">Block / section</Label>
              <Input
                id="ms-block"
                value={form.block}
                onChange={(e) => setForm((f) => ({ ...f, block: e.target.value }))}
                placeholder="e.g. 3BSIT-SD-01"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ms-course">Course name</Label>
              <Input
                id="ms-course"
                value={form.courseName}
                onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))}
                placeholder="ITE 401 - Platform Technologies"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ms-schedule">Schedule</Label>
              <Input
                id="ms-schedule"
                value={form.schedule}
                onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                placeholder="Mon 9:00 AM - 10:30 AM | Wed 9:00 AM - 10:30 AM"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-room">Room</Label>
              <Input
                id="ms-room"
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                placeholder="Lab 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-prof">Assigned professor email</Label>
              <Input
                id="ms-prof"
                type="email"
                value={form.assignedProfessorEmail}
                onChange={(e) => setForm((f) => ({ ...f, assignedProfessorEmail: e.target.value }))}
                placeholder="professor@phinmaed.edu.ph"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-grace">Default grace (minutes, optional)</Label>
              <Input
                id="ms-grace"
                type="number"
                min={0}
                max={180}
                value={form.graceOverrideMinutes === '' ? '' : form.graceOverrideMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, graceOverrideMinutes: e.target.value === '' ? '' : e.target.value }))
                }
                placeholder="Leave empty for system default"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-order">Sort order</Label>
              <Input
                id="ms-order"
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={saving} className="gap-2">
                <Plus className="w-4 h-4" />
                {saving ? 'Saving…' : 'Add row'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="space-y-2 flex-1 max-w-xs">
          <Label htmlFor="ms-filter">Filter by block</Label>
          <Input
            id="ms-filter"
            value={filterBlock}
            onChange={(e) => setFilterBlock(e.target.value)}
            placeholder="All blocks"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => load()} disabled={isLoading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button type="button" onClick={handleSync} disabled={syncing} className="gap-2">
            <Save className="w-4 h-4" />
            {syncing ? 'Syncing…' : 'Sync all blocks → students'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-500">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No master rows yet. Add offerings above.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Block</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead className="w-24">Grace</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.block}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={row.courseName}>
                      {row.courseName}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm" title={row.schedule}>
                      {row.schedule}
                    </TableCell>
                    <TableCell>{row.room || '—'}</TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate" title={row.assignedProfessorEmail}>
                      {row.assignedProfessorEmail || '—'}
                    </TableCell>
                    <TableCell>{row.graceOverrideMinutes ?? '—'}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(row.id)}
                        aria-label="Delete row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
