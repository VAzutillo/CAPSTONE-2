import React, { useEffect, useState } from 'react';
import { Archive, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';

import { API_BASE_URL } from '../../config';

export function ArchiveRequests({ canReview }: { canReview: boolean }) {
  type ArchiveRequest = {
    id: string;
    requestId: string;
    student: string;
    block: string;
    reason: string;
    status: string;
    requestedBy: string;
  };
  const [requests, setRequests] = useState([] as ArchiveRequest[]);
  const [studentName, setStudentName] = useState('');
  const [studentBlock, setStudentBlock] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [successMessage, setSuccessMessage] = useState(null as string | null);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/archive-requests`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load requests');
      setRequests(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!studentName.trim() || !studentBlock.trim() || !reason.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/archive-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentName: studentName.trim(), studentBlock: studentBlock.trim(), reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSuccessMessage('Request submitted successfully');
      setStudentName('');
      setStudentBlock('');
      setReason('');
      fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/archive-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Archive Requests</h1>
        <p className="text-neutral-500">Report students who need to be archived.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit a Request</CardTitle>
          <CardDescription>Send a request to the super admin team (not delete).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">Student Name</Label>
                <Input id="student-name" placeholder="Student full name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-block">Block / Section</Label>
                <Input id="student-block" placeholder="Year 2 - Block 7" value={studentBlock} onChange={(e) => setStudentBlock(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="archive-reason">Reason</Label>
              <Textarea id="archive-reason" rows={4} placeholder="Explain why the student should be archived." value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <Button type="submit" className="bg-neutral-900 hover:bg-neutral-800 gap-2" disabled={isSubmitting}>
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Recent Requests</h2>
        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-neutral-500">No archive requests yet.</p>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{request.student}</CardTitle>
                    <CardDescription>
                      {request.block} • {request.requestedBy}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {canReview && (
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusUpdate(request.id, e.target.value)}
                        className="text-sm rounded border border-neutral-200 px-2 py-1"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    )}
                    {!canReview && <Badge variant="outline">{request.status}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-sm text-neutral-600">
                  <Archive className="w-4 h-4" />
                  {request.reason}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
