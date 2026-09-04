import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

import { API_BASE_URL } from '../../config';

type AttendanceRecord = {
  id: string;
  date: string;
  status: 'Present' | 'Late' | 'Absent' | string;
  time: string;
  note: string;
};

type AttendanceStats = {
  presentDays: number;
  lateDays: number;
  absentDays: number;
};

export function StudentAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAttendance = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/students/attendance`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load attendance');
        }

        if (isMounted) {
          setRecords(Array.isArray(data.records) ? data.records : []);
          setStats({
            presentDays: data.stats?.presentDays ?? 0,
            lateDays: data.stats?.lateDays ?? 0,
            absentDays: data.stats?.absentDays ?? 0,
          });
        }
      } catch (error) {
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to load attendance');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAttendance();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Attendance</h1>
        <p className="text-neutral-500">Track your daily attendance and status history.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-500">Present Days</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            {stats.presentDays}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-500">Late Days</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold text-amber-600">
            <Clock className="w-5 h-5" />
            {stats.lateDays}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-500">Absent Days</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold text-red-600">
            <XCircle className="w-5 h-5" />
            {stats.absentDays}
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check-in Time</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-neutral-500">
                  Loading attendance...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && records.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-neutral-500">
                  No attendance records yet.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              records.map((row) => (
                <TableRow key={row.id || `${row.date}-${row.status}`}>
                  <TableCell className="font-medium">{row.date}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        row.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-700'
                          : row.status === 'Late'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell>{row.time}</TableCell>
                  <TableCell className="text-neutral-500">{row.note || '-'}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
