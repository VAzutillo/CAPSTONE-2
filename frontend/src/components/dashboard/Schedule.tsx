import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { API_BASE_URL } from '../../config';
import type { UserRole } from '../../types/rbac';

type CourseEntry = { courseName: string; schedule: string; room: string };
type BlockEntry = { block: string; studentCount: number; courses: CourseEntry[] };

type MasterRow = {
  id: string;
  block: string;
  courseName: string;
  schedule: string;
  room: string;
  assignedProfessorEmail: string;
  graceOverrideMinutes: number | null;
};

function reportsBaseForRole(role: UserRole): string {
  if (role === 'super_admin') return '/super-admin/reports';
  if (role === 'program_head') return '/program-head/reports';
  return '/admin/reports';
}

function GracePeriodsPanel() {
  const [rows, setRows] = useState<MasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/master-schedule`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      const list = Array.isArray(data.entries) ? data.entries : [];
      setRows(list);
      const d: Record<string, string> = {};
      list.forEach((r: MasterRow) => {
        d[r.id] =
          r.graceOverrideMinutes === null || r.graceOverrideMinutes === undefined
            ? ''
            : String(r.graceOverrideMinutes);
      });
      setDraft(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveRow = async (id: string) => {
    const raw = draft[id];
    const graceOverrideMinutes = raw === '' ? null : Math.min(180, Math.max(0, Number(raw)));
    if (raw !== '' && Number.isNaN(Number(raw))) {
      setError('Grace minutes must be a number or empty for default.');
      return;
    }
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/master-schedule/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ graceOverrideMinutes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="text-neutral-500 py-8 text-center">Loading grace settings…</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">
        Adjust how many minutes after the scheduled start time a scan still counts as <strong>Present</strong> instead
        of <strong>Late</strong> for your assigned classes. Leave blank to use the system default (see Super Admin
        settings).
      </p>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-2 text-sm">{error}</div>
      )}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-neutral-500 text-sm">
            No master schedule rows are assigned to your account yet. Ask your Program Head to assign your email on the
            master timetable.
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Block</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="w-36">Grace (min)</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium whitespace-nowrap">{r.block}</TableCell>
                    <TableCell className="max-w-[180px]">
                      <span className="line-clamp-2 text-sm">{r.courseName}</span>
                    </TableCell>
                    <TableCell className="max-w-[200px] text-sm text-neutral-600">
                      <span className="line-clamp-2">{r.schedule}</span>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={180}
                        placeholder="Default"
                        value={draft[r.id] ?? ''}
                        onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={savingId === r.id}
                        onClick={() => saveRow(r.id)}
                      >
                        {savingId === r.id ? '…' : 'Save'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScheduleOverviewBody({
  role,
  teacherName,
  blocks,
  goToBlockStudents,
}: {
  role: UserRole;
  teacherName: string;
  blocks: BlockEntry[];
  goToBlockStudents: (block: string) => void;
}) {
  return (
    <>
      {blocks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            No blocks or courses assigned yet. Ask a super admin to set your handled blocks.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {blocks.map(({ block, studentCount, courses }) => (
            <Card key={block} className="overflow-hidden">
              <CardHeader className="bg-neutral-50 border-b border-neutral-100 py-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>{block}</span>
                    <span className="text-sm font-normal text-neutral-500">({studentCount} students)</span>
                  </CardTitle>
                  <button
                    type="button"
                    onClick={() => goToBlockStudents(block)}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Users className="w-4 h-4" />
                    View students
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {courses.length === 0 ? (
                  <div className="px-6 py-4 text-neutral-500 text-sm">No course details from students yet.</div>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {courses.map((c, i) => (
                      <li
                        key={`${c.courseName}-${c.schedule}-${c.room}-${i}`}
                        className="px-6 py-4 hover:bg-neutral-50/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <div>
                              <span className="text-neutral-500">Subject name:</span>{' '}
                              <span className="font-medium text-neutral-900">{c.courseName || '—'}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500">Schedule:</span>{' '}
                              <span className="text-neutral-900">{c.schedule || '—'}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500">Room:</span>{' '}
                              <span className="text-neutral-900">{c.room || '—'}</span>
                            </div>
                            {teacherName && (
                              <div>
                                <span className="text-neutral-500">Teacher:</span>{' '}
                                <span className="text-neutral-900">{teacherName}</span>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => goToBlockStudents(block)}
                            className="shrink-0 text-emerald-700 hover:text-emerald-800 text-sm font-medium"
                          >
                            View students
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export function Schedule({ role }: { role: UserRole }) {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState('');
  const [blocks, setBlocks] = useState<BlockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setError(null);
    const fetchSchedule = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/schedule-summary`, {
          credentials: 'include',
          signal: ac.signal,
        });
        const text = await res.text();
        const data = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
        if (!data) throw new Error('Invalid response');
        if (!res.ok) throw new Error(data.error || 'Failed to load schedule');
        setTeacherName(data.teacherName || '');
        setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load schedule');
      } finally {
        if (!ac.signal.aborted) setIsLoading(false);
      }
    };
    fetchSchedule();
    return () => ac.abort();
  }, []);

  const goToBlockStudents = (block: string) => {
    navigate(`${reportsBaseForRole(role)}?block=${encodeURIComponent(block)}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-neutral-500">Loading schedule…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900">Class Schedule</h1>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">{error}</div>
      </div>
    );
  }

  const showGraceTab = role === 'admin';

  const header = (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Class Schedule</h1>
      <p className="text-neutral-500 text-sm mt-1">
        Your assigned blocks and courses (from enrollment). Open reports for attendance detail.
      </p>
    </div>
  );

  if (!showGraceTab) {
    return (
      <div className="space-y-6">
        {header}
        <ScheduleOverviewBody
          role={role}
          teacherName={teacherName}
          blocks={blocks}
          goToBlockStudents={goToBlockStudents}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      <Tabs defaultValue="overview" className="w-full gap-4">
        <TabsList className="w-full sm:w-auto h-auto flex flex-wrap gap-1 bg-neutral-100 p-1 rounded-lg">
          <TabsTrigger
            value="overview"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm gap-1.5"
          >
            <Calendar className="w-4 h-4 shrink-0" />
            Class overview
          </TabsTrigger>
          <TabsTrigger
            value="grace"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm gap-1.5"
          >
            <Clock className="w-4 h-4 shrink-0" />
            Grace periods
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <ScheduleOverviewBody
            role={role}
            teacherName={teacherName}
            blocks={blocks}
            goToBlockStudents={goToBlockStudents}
          />
        </TabsContent>
        <TabsContent value="grace" className="mt-4">
          <GracePeriodsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
