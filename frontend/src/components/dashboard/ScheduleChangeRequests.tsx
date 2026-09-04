import React, { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { API_BASE_URL } from '../../config';

type RequestRow = {
  id: string;
  studentName: string;
  block: string;
  courseName: string;
  currentSchedule: string;
  currentRoom: string;
  requestedSchedule: string;
  requestedRoom: string;
  status: string;
  createdAt: string;
};

export function ScheduleChangeRequests() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchRequests = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/schedule-change-requests`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load schedule change requests');
        if (isMounted) {
          setRequests(Array.isArray(data.requests) ? data.requests : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load schedule change requests');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchRequests();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/schedule-change-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, adminNote: noteById[id] || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update request');
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Schedule Change Requests</h1>
        <p className="text-neutral-500">
          Review schedule and room change requests submitted by students. Approving a request will update the student’s
          schedule.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-neutral-700">
            <ClipboardList className="w-4 h-4" />
            Pending & recent requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-neutral-500">
                      Loading requests...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-neutral-500">
                      No schedule change requests yet.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium text-neutral-900">{req.studentName || 'Unknown'}</TableCell>
                      <TableCell className="text-neutral-600">{req.block || '—'}</TableCell>
                      <TableCell className="text-neutral-600">{req.courseName}</TableCell>
                      <TableCell className="text-xs text-neutral-600 whitespace-pre-line">
                        {req.currentSchedule || '—'}
                        {req.currentRoom ? `\nRoom: ${req.currentRoom}` : ''}
                      </TableCell>
                      <TableCell className="text-xs text-neutral-600 whitespace-pre-line">
                        {req.requestedSchedule || '—'}
                        {req.requestedRoom ? `\nRoom: ${req.requestedRoom}` : ''}
                      </TableCell>
                      <TableCell>
                        {req.status === 'approved' ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approved
                          </span>
                        ) : req.status === 'rejected' ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-y-2">
                        <Textarea
                          placeholder="Admin note (optional)"
                          value={noteById[req.id] || ''}
                          onChange={(e) =>
                            setNoteById((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                          className="mb-2 resize-none text-xs"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(req.id, 'rejected')}
                          >
                            Reject
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => updateStatus(req.id, 'approved')}
                          >
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

