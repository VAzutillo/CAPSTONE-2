import React, { useEffect, useState } from 'react';
import { Lock, Mail, User, BookOpen, CalendarClock, DoorClosed, Layers, Hash, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { API_BASE_URL } from '../config';

const BLOCK_OPTIONS = [
  '3BSIT-SD-01', '3BSIT-SD-02', '3BSIT-CS-01', '3BSIT-CS-02',
  '3BSIT-DA-01', '3BSIT-BI-01', '3BSIT-BI-02',
];

const SUBJECT_OPTIONS = [
  'ITE 293 - Systems Administration and Maintenance',
  'ITE 294 - Capstone Project and Research 1',
  'ITE 295 - Information Assurance and Security 2',
  'ITE 296 - Computer Forensics',
  'ITE 297 - Ethical Hacking',
  'ITE 260 - Computer Programming 1',
  'ITE 366 - Introduction to Computing (including IT Fundamentals)',
  'ITE 186 - Computer Programming 2',
  'ITE 399 - Human Computer Interaction 1',
  'ITE 031 - Data Structures and Algorithms',
  'ITE 083 - IT Project Management',
  'ITE 292 - Networking 1',
  'ITE 298 - Information Management (Including Fundamentals of Database Systems)',
  'ITE 300 - Object-Oriented Programming',
  'ITE 308 - Web System and Technologies',
  'ITE 380 - Human Computer Interaction 2',
  'ITE 393 - Applications Development and Emerging Technologies (including Event-Driven Programming)',
  'ITE 400 - Systems Integration and Architecture',
  'ITE 302 - Information Assurance and Security 1',
  'ITE 307 - Quantitative Methods (including Modeling and Simulation)',
  'ITE 314 - Advanced Database Systems',
  'ITE 353 - Data Scalability & Analytics',
  'ITE 359 - Networking 2',
  'ITE 383 - Network Security',
  'ITE 401 - Platform Technologies',
  // Minor subjects
  'MAT 152 - Mathematics in the Modern World',
  'NST 015 - National Service Training Program 1',
  'PED 030 - Physical Activities Toward Health and Fitness (PATHFit 1): Movement Competency Training',
  'ART 002 - Art Appreciation',
  'NST 016 - National Service Training Program 2',
  'PED 031 - Physical Activities Toward Health and Fitness (PATHFit 2): Exercise-Based Fitness Activities',
  'HIS 007 - Life and Works of Rizal',
  'PED 032 - Physical Activities Toward Health and Fitness (PATHFit 3): Individual and Dual Sports',
  'SSP 005 - Student Success Program 1',
  'PED 033 - Physical Activities Toward Health and Fitness (PATHFit 4): Team Sports',
  'SSP 006 - Student Success Program 2',
  'SSP 007 - Student Success Program 3',
  'SSP 008 - Student Success Program 4',
  // General subjects
  'GEN 001 - Purposive Communication',
  'GEN 002 - Understanding the Self',
  'GEN 006 - Ethics',
  'GEN 005 - The Contemporary World',
  'GEN 008 - Living in the IT Era',
  'GEN 003 - Science, Technology and Society',
  'GEN 004 - Readings in Philippine History',
  'GEN 009 - The Entrepreneurial Mind',
  "GEN 013 - People and Earth's Ecosystems",
];

const DAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const TIME_SCHEDULE_OPTIONS = [
  '7:30 AM - 9:00 AM',
  '9:00 AM - 10:30 AM',
  '10:30 AM - 12:00 PM',
  '12:00 PM - 1:30 PM',
  '1:30 PM - 3:00 PM',
  '3:00 PM - 4:30 PM',
  '4:30 PM - 6:00 PM',
];

const CUSTOM_TIME_VALUE = '__custom_time__';

type CourseSchedule = {
  courseName: string;
  day1: string;
  day2: string;
  time1Type: 'preset' | 'custom';
  time1Slot: string;
  time1Start: string;
  time1End: string;
  room1: string;
  time2Type: 'preset' | 'custom';
  time2Slot: string;
  time2Start: string;
  time2End: string;
  room2: string;
  sameTime: boolean;
  sameRoom: boolean;
};

const to24Hour = (value: string) => {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!match) return '';
  let hours = Number(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (Number.isNaN(hours)) return '';
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const parsePresetTimeRange = (slot: string) => {
  const match = String(slot || '').match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
  if (!match) return { startTime: '', endTime: '' };
  return {
    startTime: to24Hour(match[1]),
    endTime: to24Hour(match[2]),
  };
};

const formatTime12 = (value: string) => {
  const [h, m] = String(value || '').split(':');
  if (!m) return value;
  let hours = Number(h);
  if (Number.isNaN(hours)) return value;
  const period = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${m} ${period}`;
};

const buildTimeLabel = (type: 'preset' | 'custom', slot: string, start: string, end: string) => {
  if (type === 'custom') {
    if (!start || !end) return '';
    return `${formatTime12(start)} - ${formatTime12(end)}`;
  }
  return slot || '';
};

const getPasswordFeedback = (password: string) => {
  const lengthOk = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const missing: string[] = [];
  if (!lengthOk) missing.push(`${8 - password.length} more characters`);
  if (!hasUpper) missing.push('1 uppercase letter');
  if (!hasLower) missing.push('1 lowercase letter');
  if (!hasNumber) missing.push('1 number');
  if (!hasSymbol) missing.push('1 symbol character');

  let strengthScore = 0;
  if (lengthOk) strengthScore += 1;
  if (hasUpper) strengthScore += 1;
  if (hasLower) strengthScore += 1;
  if (hasNumber) strengthScore += 1;
  if (hasSymbol) strengthScore += 1;

  let strengthLabel = 'Very Poor';
  if (strengthScore >= 4) strengthLabel = 'Strong';
  else if (strengthScore === 3) strengthLabel = 'Good';
  else if (strengthScore === 2) strengthLabel = 'Weak';

  return {
    missing,
    strengthLabel,
  };
};

export function StudentRegistrationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [isLocked, setIsLocked] = useState(false);
  const [tokenValid, setTokenValid] = useState(null as boolean | null);
  const [tokenError, setTokenError] = useState(null as string | null);
  const [prefillEmail, setPrefillEmail] = useState(null as string | null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null as string | null);
  const [successMessage, setSuccessMessage] = useState(null as string | null);
  const [currentStep, setCurrentStep] = useState('details' as 'details' | 'schedule');
  const [fingerprintId, setFingerprintId] = useState(null as string | null);
  const [fingerprintCopied, setFingerprintCopied] = useState(false);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [block, setBlock] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([] as string[]);
  const [courses, setCourses] = useState([] as CourseSchedule[]);
  const [scheduleEnrollmentMode, setScheduleEnrollmentMode] = useState<'manual' | 'official'>('manual');
  const [officialScheduleLoading, setOfficialScheduleLoading] = useState(false);
  const [officialScheduleCourses, setOfficialScheduleCourses] = useState(
    [] as { courseName: string; schedule: string; room: string }[]
  );

  const maxCoursesReached = selectedSubjects.length >= 12;

  useEffect(() => {
    if (!tokenFromUrl) {
      setTokenValid(false);
      setTokenError('Registration requires an invite link from your admin or teacher.');
      return;
    }
    const validate = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(`${API_BASE_URL}/api/auth/invite/${encodeURIComponent(tokenFromUrl)}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({}));
        if (data.valid) {
          setTokenValid(true);
          if (data.email) setPrefillEmail(data.email);
        } else {
          setTokenValid(false);
          setTokenError(data.error || 'Invalid or expired invite link.');
        }
      } catch (err) {
        setTokenValid(false);
        const msg = err instanceof Error && err.name === 'AbortError'
          ? 'Request timed out. Check your connection and that the app is running.'
          : 'Failed to validate invite link. Check your connection.';
        setTokenError(msg);
      }
    };
    validate();
  }, [tokenFromUrl]);

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  useEffect(() => {
    if (!block.trim()) {
      setOfficialScheduleCourses([]);
      return;
    }
    const ac = new AbortController();
    setOfficialScheduleLoading(true);
    fetch(
      `${API_BASE_URL}/api/public/block-master-schedule?block=${encodeURIComponent(block.trim())}`,
      { signal: ac.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        if (ac.signal.aborted) return;
        const list = Array.isArray(data.courses) ? data.courses : [];
        setOfficialScheduleCourses(list);
      })
      .catch(() => {
        if (!ac.signal.aborted) setOfficialScheduleCourses([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setOfficialScheduleLoading(false);
      });
    return () => ac.abort();
  }, [block]);

  useEffect(() => {
    if (scheduleEnrollmentMode === 'official' && officialScheduleCourses.length === 0) {
      setScheduleEnrollmentMode('manual');
    }
  }, [officialScheduleCourses, scheduleEnrollmentMode]);

  useEffect(() => {
    setCourses((prev) => {
      const bySubject = new Map(prev.map((course) => [course.courseName, course]));
      return selectedSubjects.map((subject) => (
        bySubject.get(subject) ?? {
          courseName: subject,
          day1: '',
          day2: '',
          time1Type: 'preset',
          time1Slot: '',
          time1Start: '',
          time1End: '',
          room1: '',
          time2Type: 'preset',
          time2Slot: '',
          time2Start: '',
          time2End: '',
          room2: '',
          sameTime: false,
          sameRoom: false,
        }
      ));
    });
  }, [selectedSubjects]);

  const validateStepOne = () => {
    if (!lastName || !firstName || !idNumber || !block || !email || !password || !confirmPassword) {
      setError('Please fill out all required fields.');
      return false;
    }

    if (!/^[0-9\-]+$/.test(idNumber.trim())) {
      setError('ID number must contain only numbers and dashes (e.g. 03-2324-035749).');
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isAllowedEmail =
      normalizedEmail.endsWith('@phinmaed.com') ||
      normalizedEmail.endsWith('@phinmaed.edu.ph');
    if (!isAllowedEmail) {
      setError('Please use your PHINMAED email address (e.g. @phinmaed.com).');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    if (scheduleEnrollmentMode === 'official') {
      if (officialScheduleCourses.length === 0) {
        setError(
          'No published master schedule for this block. Pick another block, enter subjects manually, or ask your Program Head to publish the timetable.'
        );
        return false;
      }
    } else {
      if (selectedSubjects.length === 0) {
        setError('Please select at least one subject from your COM receipt.');
        return false;
      }

      if (selectedSubjects.length > 12) {
        setError('You can only register up to 12 subjects.');
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    setError(null);
    setSuccessMessage(null);
    if (!validateStepOne()) return;
    setCurrentStep('schedule');
  };

  const handleOfficialRegister = async () => {
    setError(null);
    setSuccessMessage(null);
    if (!validateStepOne()) return;

    const confirmed = window.confirm(
      'Submit registration using the official published schedule for your block? Your subject list will match the Program Head master timetable.'
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const formattedName = `${lastName.trim()}, ${firstName.trim()}${middleInitial.trim()
        ? ` ${middleInitial.trim()}.`
        : ''}`;
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenFromUrl,
          role: 'student',
          name: formattedName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          middleInitial: middleInitial.trim(),
          idNumber: idNumber.trim(),
          block,
          email: normalizedEmail,
          password,
          comCourses: [],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      setIsLocked(true);
      setFingerprintId(typeof data.fingerprintId === 'string' ? data.fingerprintId : null);
      setSuccessMessage('Registration successful. Save your fingerprint ID below.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateStepOne()) return;

    if (courses.length === 0) {
      setError('Please select at least one subject.');
      return;
    }

    if (courses.length > 12) {
      setError('You can only register up to 12 subjects.');
      return;
    }

    const hasIncompleteCourse = courses.some((course) => {
      if (!course.day1.trim()) return true;
      const time1Label = buildTimeLabel(course.time1Type, course.time1Slot, course.time1Start, course.time1End);
      if (!time1Label) return true;
      if (!course.room1.trim()) return true;
      if (course.day2.trim()) {
        const time2Source = course.sameTime
          ? { type: course.time1Type, slot: course.time1Slot, start: course.time1Start, end: course.time1End }
          : { type: course.time2Type, slot: course.time2Slot, start: course.time2Start, end: course.time2End };
        const time2Label = buildTimeLabel(
          time2Source.type,
          time2Source.slot,
          time2Source.start,
          time2Source.end
        );
        if (!time2Label) return true;
        const room2Value = course.sameRoom ? course.room1 : course.room2;
        if (!room2Value.trim()) return true;
      }
      return false;
    });
    if (hasIncompleteCourse) {
      setError('Each subject must include day, time schedule, and room assigned.');
      return;
    }

    const confirmed = window.confirm(
      'Submit your registration and schedules? You will receive your fingerprint ID after submission.'
    );
    if (!confirmed) return;

    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const formattedName = `${lastName.trim()}, ${firstName.trim()}${middleInitial.trim()
        ? ` ${middleInitial.trim()}.`
        : ''}`;
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokenFromUrl,
          role: 'student',
          name: formattedName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          middleInitial: middleInitial.trim(),
          idNumber: idNumber.trim(),
          block,
          email: normalizedEmail,
          password,
          comCourses: courses.map((course) => {
            const time1Label = buildTimeLabel(course.time1Type, course.time1Slot, course.time1Start, course.time1End);
            const time1Range = course.time1Type === 'custom'
              ? { startTime: course.time1Start, endTime: course.time1End }
              : parsePresetTimeRange(course.time1Slot);

            const time2Source = course.sameTime
              ? { type: course.time1Type, slot: course.time1Slot, start: course.time1Start, end: course.time1End }
              : { type: course.time2Type, slot: course.time2Slot, start: course.time2Start, end: course.time2End };
            const time2Label = buildTimeLabel(time2Source.type, time2Source.slot, time2Source.start, time2Source.end);
            const time2Range = time2Source.type === 'custom'
              ? { startTime: time2Source.start, endTime: time2Source.end }
              : parsePresetTimeRange(time2Source.slot);

            const room2Value = course.sameRoom ? course.room1 : course.room2;

            const scheduleParts = [`${course.day1.trim()} ${time1Label}`.trim()];
            if (course.day2.trim()) {
              scheduleParts.push(`${course.day2.trim()} ${time2Label}`.trim());
            }

            const roomParts = [course.room1.trim()];
            if (course.day2.trim()) {
              roomParts.push(room2Value.trim());
            }

            const sessions = [
              {
                day: course.day1.trim(),
                startTime: time1Range.startTime || '',
                endTime: time1Range.endTime || '',
                room: course.room1.trim(),
              },
            ];

            if (course.day2.trim()) {
              sessions.push({
                day: course.day2.trim(),
                startTime: time2Range.startTime || '',
                endTime: time2Range.endTime || '',
                room: room2Value.trim(),
              });
            }

            return {
              courseName: course.courseName.trim(),
              schedule: scheduleParts.filter(Boolean).join(' | '),
              room: roomParts.filter(Boolean).join(' | '),
              sessions,
            };
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setIsLocked(true);
      setFingerprintId(typeof data.fingerprintId === 'string' ? data.fingerprintId : null);
      setSuccessMessage('Registration successful. Save your fingerprint ID below.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCourse = (index: number, updater: (course: CourseSchedule) => CourseSchedule) => {
    setCourses((prev) =>
      prev.map((course, courseIndex) => (courseIndex === index ? updater(course) : course))
    );
  };

  const handleSubjectToggle = (subject: string) => {
    setError(null);
    setSelectedSubjects((prev) => {
      const isSelected = prev.includes(subject);
      if (isSelected) return prev.filter((s) => s !== subject);
      if (maxCoursesReached) {
        setError('You can only select up to 12 subjects.');
        return prev;
      }
      return [...prev, subject];
    });
  };

  const handleCopyFingerprintId = async () => {
    if (!fingerprintId) return;
    try {
      await navigator.clipboard.writeText(fingerprintId);
      setFingerprintCopied(true);
      setTimeout(() => setFingerprintCopied(false), 2000);
    } catch {
      setError('Could not copy fingerprint ID');
    }
  };

  if (isLocked) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 mx-auto">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">Registration complete</h1>
          <p className="text-neutral-500">Save this fingerprint ID to register your fingerprint on the IoT device.</p>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-left space-y-2">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Fingerprint ID</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-neutral-900 break-all">
                {fingerprintId || 'Not available'}
              </span>
              {fingerprintId && (
                <button
                  type="button"
                  onClick={handleCopyFingerprintId}
                  className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
                >
                  {fingerprintCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {fingerprintCopied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/login/student')}
            className="w-full py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 focus:ring-4 focus:ring-neutral-900/20 transition-all"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (tokenValid === false && !tokenFromUrl) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mx-auto">
            <Lock className="w-5 h-5 text-amber-700" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">Invite link required</h1>
          <p className="text-neutral-500">
            Student registration is by invite only. Ask your admin or teacher to send you a registration link.
          </p>
          <button
            onClick={() => navigate('/login/student')}
            className="w-full py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 focus:ring-4 focus:ring-neutral-900/20 transition-all"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (tokenValid === false && tokenFromUrl) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto">
            <Lock className="w-5 h-5 text-red-700" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">Invalid invite link</h1>
          <p className="text-neutral-500">{tokenError ?? 'Invalid or expired invite link. Please request a new one.'}</p>
          <button
            onClick={() => navigate('/login/student')}
            className="w-full py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 focus:ring-4 focus:ring-neutral-900/20 transition-all"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (tokenValid !== true) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
          <p className="mt-4 text-neutral-600">Validating invite link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 mb-4">
            <User className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Student Registration</h1>
          <p className="text-neutral-500">Complete your student profile to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <p className="text-sm text-emerald-700">{successMessage}</p>
            </div>
          )}

          {currentStep === 'details' ? (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Full Name</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      id="student-last-name"
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Last name"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      id="student-first-name"
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="First name"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      id="student-middle-initial"
                      type="text"
                      value={middleInitial}
                      onChange={(event) =>
                        setMiddleInitial(event.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase())
                      }
                      placeholder="M"
                      maxLength={1}
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-500">Format: Last name, First name, Middle initial</p>
              </div>

              <div>
                <label htmlFor="student-id-number" className="block text-sm font-medium text-neutral-700 mb-2">
                  ID Number
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    id="student-id-number"
                    type="text"
                    inputMode="numeric"
                    value={idNumber}
                    onChange={(event) => setIdNumber(event.target.value.replace(/[^0-9\-]/g, ''))}
                    placeholder="03-2324-035749"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
                <p className="mt-1 text-xs text-neutral-500">Numbers and dashes only (e.g. 03-2324-035749)</p>
              </div>

              <div>
                <label htmlFor="student-block" className="block text-sm font-medium text-neutral-700 mb-2">
                  Block / Section
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none z-10" />
                  <select
                    id="student-block"
                    value={block}
                    onChange={(event) => setBlock(event.target.value)}
                    required
                    className="w-full pl-11 pr-10 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 appearance-none bg-white"
                  >
                    <option value="">Select block / section</option>
                    {BLOCK_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {block.trim() ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 space-y-2">
                  <p className="text-sm font-medium text-neutral-800">Subject &amp; schedule source</p>
                  {officialScheduleLoading ? (
                    <p className="text-xs text-neutral-500">Checking for a published master timetable…</p>
                  ) : officialScheduleCourses.length > 0 ? (
                    <>
                      <p className="text-xs text-neutral-600">
                        Your block has an official timetable ({officialScheduleCourses.length} courses). You can load it
                        automatically or enter subjects from your COM receipt.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => setScheduleEnrollmentMode('official')}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            scheduleEnrollmentMode === 'official'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          Use official block schedule
                        </button>
                        <button
                          type="button"
                          onClick={() => setScheduleEnrollmentMode('manual')}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            scheduleEnrollmentMode === 'manual'
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          Enter manually from COM
                        </button>
                      </div>
                      {scheduleEnrollmentMode === 'official' && (
                        <ul className="mt-1 max-h-28 overflow-y-auto text-xs text-neutral-600 space-y-0.5 border border-neutral-100 rounded-md bg-white p-2">
                          {officialScheduleCourses.map((c, i) => (
                            <li key={`${c.courseName}-${i}`}>
                              <span className="font-medium text-neutral-800">{c.courseName}</span>
                              {c.schedule ? ` · ${c.schedule}` : ''}
                              {c.room ? ` · ${c.room}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-neutral-500">
                      No official timetable for this block yet. Select subjects from your COM receipt below.
                    </p>
                  )}
                </div>
              ) : null}

              <div>
                <label htmlFor="student-email" className="block text-sm font-medium text-neutral-700 mb-2">
                  PHINMAED Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    id="student-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  placeholder="student@phinmaed.com"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="student-password" className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    id="student-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full pl-11 pr-11 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {(() => {
                  const feedback = getPasswordFeedback(password);
                  const missingText = feedback.missing.length ? feedback.missing.join(', ') : 'All requirements met';
                  return (
                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className="text-xs text-neutral-500">
                        {missingText}
                      </p>
                      <p className="text-xs text-neutral-600">
                        Strength: <span className="font-medium">{feedback.strengthLabel}</span>
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label htmlFor="student-confirm-password" className="block text-sm font-medium text-neutral-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    id="student-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-11 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {scheduleEnrollmentMode === 'manual' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-700">COM Subjects</p>
                      <p className="text-xs text-neutral-500">Select the subjects listed on your COM receipt.</p>
                    </div>
                    <span className="text-xs text-neutral-500">{selectedSubjects.length}/12 selected</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUBJECT_OPTIONS.map((subject) => {
                      const isSelected = selectedSubjects.includes(subject);
                      return (
                        <label
                          key={subject}
                          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                              : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSubjectToggle(subject)}
                            className="mt-1"
                          />
                          <div className="flex items-start gap-2">
                            <BookOpen className="w-4 h-4 text-neutral-400 mt-0.5" />
                            <span>{subject}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {maxCoursesReached && (
                    <p className="text-xs text-amber-600">You have reached the 12-subject limit.</p>
                  )}
                </div>
              ) : null}

              {scheduleEnrollmentMode === 'official' ? (
                <button
                  type="button"
                  onClick={handleOfficialRegister}
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800 focus:ring-4 focus:ring-emerald-900/20 transition-all disabled:opacity-60"
                >
                  {isLoading ? 'Submitting…' : 'Submit registration (official schedule)'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 focus:ring-4 focus:ring-neutral-900/20 transition-all"
                >
                  Next: Add schedules
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/login/student')}
                className="w-full text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Back to login
              </button>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                <span className="font-medium text-neutral-900">{selectedSubjects.length}</span> subjects selected. Add
                the day, time, and room for each subject.
              </div>

              <div className="space-y-4">
                {courses.map((course, index) => {
                  const time1SelectValue =
                    course.time1Type === 'custom' ? CUSTOM_TIME_VALUE : course.time1Slot;
                  const time2SelectValue = course.sameTime
                    ? (course.time1Type === 'custom' ? CUSTOM_TIME_VALUE : course.time1Slot)
                    : (course.time2Type === 'custom' ? CUSTOM_TIME_VALUE : course.time2Slot);
                  const room2Value = course.sameRoom ? course.room1 : course.room2;

                  return (
                    <div key={course.courseName} className="space-y-4 rounded-lg border border-neutral-200 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-700">Subject {index + 1}</p>
                        <span className="text-xs text-neutral-500">{course.courseName}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`com-day1-${index}`} className="block text-sm font-medium text-neutral-700 mb-2">
                            Day 1
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none z-10">
                              <span className="inline-block w-3 h-3 rounded-full border border-neutral-300" />
                            </div>
                            <select
                              id={`com-day1-${index}`}
                              value={course.day1}
                              onChange={(e) => updateCourse(index, (c) => ({ ...c, day1: e.target.value }))}
                              required
                              className="w-full pl-11 pr-10 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 appearance-none bg-white"
                            >
                              <option value="">Select day</option>
                              {DAY_OPTIONS.map((day) => (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label htmlFor={`com-day2-${index}`} className="block text-sm font-medium text-neutral-700 mb-2">
                            Day 2 (optional)
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none z-10">
                              <span className="inline-block w-3 h-3 rounded-full border border-neutral-300" />
                            </div>
                            <select
                              id={`com-day2-${index}`}
                              value={course.day2}
                              onChange={(e) =>
                                updateCourse(index, (c) => {
                                  const nextDay = e.target.value;
                                  if (!nextDay) {
                                    return {
                                      ...c,
                                      day2: '',
                                      sameTime: false,
                                      sameRoom: false,
                                      time2Type: 'preset',
                                      time2Slot: '',
                                      time2Start: '',
                                      time2End: '',
                                      room2: '',
                                    };
                                  }
                                  return { ...c, day2: nextDay };
                                })
                              }
                              className="w-full pl-11 pr-10 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 appearance-none bg-white"
                            >
                              <option value="">No second day</option>
                              {DAY_OPTIONS.map((day) => (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor={`com-schedule1-${index}`} className="block text-sm font-medium text-neutral-700">
                            Time (Day 1)
                          </label>
                          <div className="relative">
                            <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none z-10" />
                            <select
                              id={`com-schedule1-${index}`}
                              value={time1SelectValue}
                              onChange={(e) =>
                                updateCourse(index, (c) => {
                                  const value = e.target.value;
                                  const next: CourseSchedule = value === CUSTOM_TIME_VALUE
                                    ? { ...c, time1Type: 'custom', time1Slot: '' }
                                    : { ...c, time1Type: 'preset', time1Slot: value };
                                  if (next.sameTime) {
                                    return {
                                      ...next,
                                      time2Type: next.time1Type,
                                      time2Slot: next.time1Slot,
                                      time2Start: next.time1Start,
                                      time2End: next.time1End,
                                    };
                                  }
                                  return next;
                                })
                              }
                              required
                              className="w-full pl-11 pr-10 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 appearance-none bg-white"
                            >
                              <option value="">Select time schedule</option>
                              {TIME_SCHEDULE_OPTIONS.map((slot) => (
                                <option key={slot} value={slot}>
                                  {slot}
                                </option>
                              ))}
                              <option value={CUSTOM_TIME_VALUE}>Custom time</option>
                            </select>
                          </div>
                          {course.time1Type === 'custom' && (
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="time"
                                value={course.time1Start}
                                onChange={(e) =>
                                  updateCourse(index, (c) => {
                                    const next = { ...c, time1Start: e.target.value };
                                    if (next.sameTime) {
                                      return { ...next, time2Start: next.time1Start };
                                    }
                                    return next;
                                  })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none text-sm"
                              />
                              <input
                                type="time"
                                value={course.time1End}
                                onChange={(e) =>
                                  updateCourse(index, (c) => {
                                    const next = { ...c, time1End: e.target.value };
                                    if (next.sameTime) {
                                      return { ...next, time2End: next.time1End };
                                    }
                                    return next;
                                  })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none text-sm"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor={`com-room1-${index}`} className="block text-sm font-medium text-neutral-700">
                            Room (Day 1)
                          </label>
                          <div className="relative">
                            <DoorClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                              id={`com-room1-${index}`}
                              type="text"
                              value={course.room1}
                              onChange={(e) =>
                                updateCourse(index, (c) => {
                                  const next = { ...c, room1: e.target.value };
                                  if (next.sameRoom) {
                                    return { ...next, room2: next.room1 };
                                  }
                                  return next;
                                })
                              }
                              placeholder="Room 204"
                              required
                              className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
                            />
                          </div>
                        </div>
                      </div>

                      {course.day2 && (
                        <div className="space-y-3 rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-3">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <p className="text-sm font-medium text-neutral-700">Second day details</p>
                            <div className="flex flex-wrap gap-4 text-xs text-neutral-600">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={course.sameTime}
                                  onChange={(e) =>
                                    updateCourse(index, (c) => {
                                      const checked = e.target.checked;
                                      if (!checked) return { ...c, sameTime: false };
                                      return {
                                        ...c,
                                        sameTime: true,
                                        time2Type: c.time1Type,
                                        time2Slot: c.time1Slot,
                                        time2Start: c.time1Start,
                                        time2End: c.time1End,
                                      };
                                    })
                                  }
                                />
                                Same time as day 1
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={course.sameRoom}
                                  onChange={(e) =>
                                    updateCourse(index, (c) => {
                                      const checked = e.target.checked;
                                      if (!checked) return { ...c, sameRoom: false };
                                      return { ...c, sameRoom: true, room2: c.room1 };
                                    })
                                  }
                                />
                                Same room as day 1
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor={`com-schedule2-${index}`} className="block text-sm font-medium text-neutral-700">
                                Time (Day 2)
                              </label>
                              <div className="relative">
                                <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none z-10" />
                                <select
                                  id={`com-schedule2-${index}`}
                                  value={time2SelectValue}
                                  onChange={(e) =>
                                    updateCourse(index, (c) => {
                                      if (c.sameTime) return c;
                                      const value = e.target.value;
                                      return value === CUSTOM_TIME_VALUE
                                        ? { ...c, time2Type: 'custom', time2Slot: '' }
                                        : { ...c, time2Type: 'preset', time2Slot: value };
                                    })
                                  }
                                  required
                                  disabled={course.sameTime}
                                  className="w-full pl-11 pr-10 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 appearance-none bg-white disabled:bg-neutral-100"
                                >
                                  <option value="">Select time schedule</option>
                                  {TIME_SCHEDULE_OPTIONS.map((slot) => (
                                    <option key={slot} value={slot}>
                                      {slot}
                                    </option>
                                  ))}
                                  <option value={CUSTOM_TIME_VALUE}>Custom time</option>
                                </select>
                              </div>
                              {course.day2 && (course.sameTime
                                ? null
                                : course.time2Type === 'custom') && (
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="time"
                                    value={course.sameTime ? course.time1Start : course.time2Start}
                                    onChange={(e) =>
                                      updateCourse(index, (c) => (c.sameTime ? c : { ...c, time2Start: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none text-sm"
                                    disabled={course.sameTime}
                                  />
                                  <input
                                    type="time"
                                    value={course.sameTime ? course.time1End : course.time2End}
                                    onChange={(e) =>
                                      updateCourse(index, (c) => (c.sameTime ? c : { ...c, time2End: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none text-sm"
                                    disabled={course.sameTime}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label htmlFor={`com-room2-${index}`} className="block text-sm font-medium text-neutral-700">
                                Room (Day 2)
                              </label>
                              <div className="relative">
                                <DoorClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                  id={`com-room2-${index}`}
                                  type="text"
                                  value={room2Value}
                                  onChange={(e) =>
                                    updateCourse(index, (c) => (c.sameRoom ? c : { ...c, room2: e.target.value }))
                                  }
                                  placeholder="Room 204"
                                  required
                                  disabled={course.sameRoom}
                                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 outline-none transition-all text-neutral-900 placeholder:text-neutral-400 disabled:bg-neutral-100"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 focus:ring-4 focus:ring-neutral-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Submitting schedules...' : 'Submit schedules'}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep('details')}
                  className="w-full text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Back to subject selection
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
