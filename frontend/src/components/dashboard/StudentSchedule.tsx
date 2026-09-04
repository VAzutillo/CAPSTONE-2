import React, { useEffect, useState } from 'react';
import { CalendarDays, Edit3, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

import { API_BASE_URL } from '../../config';

type CourseRow = {
  courseName: string;
  schedule: string;
  room: string;
  hasPendingChange: boolean;
  requestedSchedule: string;
  requestedRoom: string;
  status: string | null;
};

export function StudentSchedule() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);
  const [newSchedule, setNewSchedule] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/students/courses`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load courses');
        }
        if (isMounted) {
          setCourses(Array.isArray(data.courses) ? data.courses : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load courses');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  const openEditDialog = (course: CourseRow) => {
    setSelectedCourse(course);
    setNewSchedule(course.requestedSchedule || course.schedule || '');
    setNewRoom(course.requestedRoom || course.room || '');
    setSuccessMessage(null);
    setError(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCourse) return;
    if (!newSchedule.trim() && !newRoom.trim()) {
      setError('Please provide a new schedule or room.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/schedule-change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseName: selectedCourse.courseName,
          requestedSchedule: newSchedule.trim(),
          requestedRoom: newRoom.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit change request');
      }
      setSuccessMessage('Request submitted. Waiting for admin approval.');
      // Mark course as pending in local state
      setCourses((prev) =>
        prev.map((course) =>
          course.courseName === selectedCourse.courseName
            ? {
                ...course,
                hasPendingChange: true,
                requestedSchedule: newSchedule.trim() || course.schedule,
                requestedRoom: newRoom.trim() || course.room,
                status: 'pending',
              }
            : course
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit change request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Subjects & Schedule</h1>
        <p className="text-neutral-500">
          View your enrolled subjects, schedules, and request changes for day, time, or room.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-neutral-700">
            <CalendarDays className="w-4 h-4" />
            Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-neutral-500">
                      Loading subjects...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && courses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-neutral-500">
                      No subjects found. Complete your registration first.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  courses.map((course) => (
                    <TableRow key={course.courseName}>
                      <TableCell className="font-medium text-neutral-900">{course.courseName}</TableCell>
                      <TableCell className="text-neutral-700">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span>{course.schedule || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-700">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-neutral-400" />
                          <span>{course.room || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-500 text-sm">—</TableCell>
                      <TableCell className="text-sm">
                        {course.hasPendingChange ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Pending changes
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Up to date
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => openEditDialog(course)}
                        >
                          <Edit3 className="w-4 h-4" />
                          {course.hasPendingChange ? 'View request' : 'Edit schedule'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit schedule</DialogTitle>
            <DialogDescription>
              Submit a request to change the day, time, or room for this subject. An admin must approve before it takes
              effect.
            </DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-sm text-neutral-700">Subject</Label>
                <p className="mt-1 text-sm font-medium text-neutral-900">{selectedCourse.courseName}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-schedule">Current schedule</Label>
                <Textarea
                  id="current-schedule"
                  value={selectedCourse.schedule || ''}
                  readOnly
                  className="resize-none bg-neutral-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-schedule">Requested schedule</Label>
                <Textarea
                  id="new-schedule"
                  placeholder="e.g. Mon 7:30–9:00, Wed 9:00–10:30"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-room">Current room</Label>
                <Textarea
                  id="current-room"
                  value={selectedCourse.room || ''}
                  readOnly
                  className="resize-none bg-neutral-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-room">Requested room</Label>
                <Textarea
                  id="new-room"
                  placeholder="e.g. Lab 201"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit request'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

