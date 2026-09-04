import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import { StaffPortalAccessGate } from './components/StaffPortalAccessGate';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { StudentRegistrationForm } from './components/StudentRegistrationForm';
import { BusinessModelCanvas } from './components/BusinessModelCanvas';
import { NotFound } from './components/NotFound';
import {
  AppReports,
  ArchiveRequests,
  AuditLogs,
  DashboardLayout,
  InviteStudents,
  Overview,
  Reports,
  Schedule,
  MasterSchedule,
  Settings,
  StudentAttendance,
  StudentProfile,
  StudentSchedule,
  ScheduleChangeRequests,
  UserManagement,
} from './components/dashboard';
import type { UserRole } from './types/rbac';
import {
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  FileText,
  Shield,
  ClipboardList,
  UserCircle,
  MessageSquareWarning,
  Link2,
  CalendarDays,
  TableProperties,
} from 'lucide-react';

import { API_BASE_URL } from './config';

type NavItem = {
  id: string;
  label: string;
  icon: any;
};

type ViewRoute = {
  id: string;
  path: string;
  element: any;
};

class RegistrationErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Registration form error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center space-y-4">
          <h1 className="text-xl font-semibold text-neutral-900">Something went wrong</h1>
          <p className="text-neutral-500 text-sm">
            The registration page could not load. Please check your connection and try again, or use the link from the same device where you received it.
          </p>
          <a
            href="/register/student"
            className="inline-block w-full py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 text-center"
          >
            Try again
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'forgot'>('login');
  const [role, setRole] = useState<UserRole>('admin');
  const [userEmail, setUserEmail] = useState<string>('');
  const [currentView, setCurrentView] = useState('overview');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const superAdminIdleTimerRef = useRef(null as any);
  const lastActivityRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isRegistrationRoute = location.pathname === '/register/student' || location.pathname.startsWith('/register/student/');

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health/status`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setIsMaintenanceMode(!!data.maintenanceMode);
        }
      } catch { /* ignore */ }
    };
    fetchMaintenance();
  }, []);

  // Check for existing session on app load (skip on public pages to avoid 401 noise)
  useEffect(() => {
    const isPublicRoute =
      isRegistrationRoute ||
      location.pathname === '/login/student' ||
      location.pathname === '/login/admin' ||
      location.pathname === '/login/super-admin' ||
      location.pathname === '/login/program-head' ||
      location.pathname.startsWith('/login/') ||
      location.pathname === '/forgot-password';

    if (isPublicRoute) {
      setIsLoadingAuth(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setRole(data.user.role);
            setUserEmail(data.user.email ?? '');
            setCurrentView(navItemsByRole[data.user.role][0]?.id ?? 'overview');
            setIsAuthenticated(true);
            const defaultPath = viewRoutesByRole[data.user.role][0]?.path ?? '/';
            if (
              location.pathname === '/' ||
              location.pathname === '/login/student' ||
              location.pathname === '/login/admin' ||
              location.pathname === '/login/super-admin' ||
              location.pathname === '/login/program-head'
            ) {
              navigate(defaultPath, { replace: true });
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setRole('admin');
      setUserEmail('');
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const SUPER_ADMIN_IDLE_MS = 10 * 60 * 1000;
    if (!isAuthenticated || role !== 'super_admin') {
      if (superAdminIdleTimerRef.current) {
        clearTimeout(superAdminIdleTimerRef.current);
      }
      return;
    }

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (superAdminIdleTimerRef.current) {
        clearTimeout(superAdminIdleTimerRef.current);
      }
      superAdminIdleTimerRef.current = setTimeout(() => {
        const idleForMs = Date.now() - lastActivityRef.current;
        if (idleForMs >= SUPER_ADMIN_IDLE_MS) {
          handleLogout();
        } else {
          resetTimer();
        }
      }, SUPER_ADMIN_IDLE_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
      if (superAdminIdleTimerRef.current) {
        clearTimeout(superAdminIdleTimerRef.current);
      }
    };
  }, [isAuthenticated, role, handleLogout]);

  const navItemsByRole: Record<UserRole, NavItem[]> = useMemo(
    () => ({
      student: [
        { id: 'student-attendance', label: 'My Attendance', icon: ClipboardList },
        { id: 'student-schedule', label: 'My Schedule', icon: CalendarDays },
        { id: 'student-profile', label: 'Profile & Security', icon: UserCircle },
        { id: 'student-report', label: 'Report an Issue', icon: MessageSquareWarning },
      ],
      admin: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'schedule', label: 'Class Schedule', icon: CalendarDays },
        { id: 'reports', label: 'Attendance Reports', icon: FileText },
        { id: 'schedule-requests', label: 'Schedule Requests', icon: ClipboardList },
        { id: 'invite-students', label: 'Invite Students', icon: Link2 },
        { id: 'archive-requests', label: 'Archive Requests', icon: ClipboardList },
      ],
      program_head: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'master-schedule', label: 'Master Schedule', icon: TableProperties },
        { id: 'reports', label: 'Attendance Reports', icon: FileText },
        { id: 'schedule-requests', label: 'Schedule Requests', icon: ClipboardList },
        { id: 'invite-students', label: 'Invite Students', icon: Link2 },
        { id: 'archive-requests', label: 'Archive Requests', icon: ClipboardList },
      ],
      super_admin: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'master-schedule', label: 'Master Schedule', icon: TableProperties },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'reports', label: 'Reports & Analytics', icon: FileText },
        { id: 'schedule-requests', label: 'Schedule Requests', icon: ClipboardList },
        { id: 'invite-students', label: 'Invite Students', icon: Link2 },
        { id: 'archive-requests', label: 'Archive Requests', icon: ClipboardList },
        { id: 'settings', label: 'System Configuration', icon: SettingsIcon },
        { id: 'logs', label: 'Audit Logs', icon: Shield },
        { id: 'app-reports', label: 'App Reports', icon: MessageSquareWarning },
      ],
    }),
    []
  );

  const viewRoutesByRole = useMemo<Record<UserRole, ViewRoute[]>>(
    () => ({
      student: [
        { id: 'student-attendance', path: '/student/attendance', element: <StudentAttendance /> },
        { id: 'student-schedule', path: '/student/schedule', element: <StudentSchedule /> },
        { id: 'student-profile', path: '/student/profile', element: <StudentProfile /> },
        { id: 'student-report', path: '/student/report', element: <AppReports mode="submit" /> },
      ],
      admin: [
        { id: 'overview', path: '/admin/overview', element: <Overview role="admin" /> },
        { id: 'schedule', path: '/admin/schedule', element: <Schedule role="admin" /> },
        { id: 'reports', path: '/admin/reports', element: <Reports role={role} /> },
        { id: 'schedule-requests', path: '/admin/schedule-requests', element: <ScheduleChangeRequests /> },
        { id: 'invite-students', path: '/admin/invite-students', element: <InviteStudents /> },
        {
          id: 'archive-requests',
          path: '/admin/archive-requests',
          element: <ArchiveRequests canReview={false} />,
        },
      ],
      program_head: [
        { id: 'overview', path: '/program-head/overview', element: <Overview role="program_head" /> },
        { id: 'master-schedule', path: '/program-head/master-schedule', element: <MasterSchedule /> },
        { id: 'reports', path: '/program-head/reports', element: <Reports role={role} /> },
        { id: 'schedule-requests', path: '/program-head/schedule-requests', element: <ScheduleChangeRequests /> },
        { id: 'invite-students', path: '/program-head/invite-students', element: <InviteStudents /> },
        {
          id: 'archive-requests',
          path: '/program-head/archive-requests',
          element: <ArchiveRequests canReview={false} />,
        },
      ],
      super_admin: [
        { id: 'overview', path: '/super-admin/overview', element: <Overview role="super_admin" /> },
        { id: 'master-schedule', path: '/super-admin/master-schedule', element: <MasterSchedule /> },
        { id: 'users', path: '/super-admin/users', element: <UserManagement /> },
        { id: 'reports', path: '/super-admin/reports', element: <Reports role={role} /> },
        { id: 'schedule-requests', path: '/super-admin/schedule-requests', element: <ScheduleChangeRequests /> },
        { id: 'invite-students', path: '/super-admin/invite-students', element: <InviteStudents /> },
        {
          id: 'archive-requests',
          path: '/super-admin/archive-requests',
          element: <ArchiveRequests canReview />,
        },
        {
          id: 'settings',
          path: '/super-admin/settings',
          element: (
            <Settings
              canManageMaintenance
              isMaintenanceMode={isMaintenanceMode}
              onToggleMaintenance={setIsMaintenanceMode}
            />
          ),
        },
        { id: 'logs', path: '/super-admin/logs', element: <AuditLogs /> },
        { id: 'app-reports', path: '/super-admin/app-reports', element: <AppReports mode="review" /> },
      ],
    }),
    [isMaintenanceMode, role]
  );

  const allowedViews = useMemo(
    () => new Set(viewRoutesByRole[role].map((r) => r.id)),
    [viewRoutesByRole, role]
  );

  const defaultPath = viewRoutesByRole[role][0]?.path ?? '/';

  useEffect(() => {
    if (!isAuthenticated || isLoadingAuth) {
      return;
    }
    if (isRegistrationRoute) {
      return;
    }
    const roleRoutes = viewRoutesByRole[role];
    const matchingRoute = roleRoutes.find((route) => route.path === location.pathname);
    if (matchingRoute) {
      if (matchingRoute.id !== currentView) {
        setCurrentView(matchingRoute.id);
      }
      return;
    }
    if (location.pathname !== defaultPath) {
      navigate(defaultPath, { replace: true });
    }
  }, [currentView, defaultPath, isAuthenticated, isLoadingAuth, location.pathname, navigate, role, viewRoutesByRole]);

  useEffect(() => {
    if (!allowedViews.has(currentView)) {
      setCurrentView(navItemsByRole[role][0]?.id ?? 'overview');
    }
  }, [allowedViews, currentView, navItemsByRole, role]);

  const handleNavigate = (viewId: string) => {
    const match = viewRoutesByRole[role].find((route) => route.id === viewId);
    if (!match) {
      return;
    }
    setCurrentView(viewId);
    navigate(match.path);
  };

  if (isRegistrationRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-neutral-200/40 to-transparent blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-neutral-300/30 to-transparent blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-neutral-200/20 blur-2xl"></div>
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              width: '24px',
              height: '24px',
              backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          ></div>
        </div>
        <div className="relative z-10 w-full max-w-4xl flex justify-center">
          <RegistrationErrorBoundary>
            <StudentRegistrationForm />
          </RegistrationErrorBoundary>
        </div>
      </div>
    );
  }

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (isMaintenanceMode && role !== 'super_admin') {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
          <div className="max-w-lg text-center bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-neutral-900">We’ll be right back</h1>
            <p className="text-neutral-600 mt-3">
              The system is currently in maintenance mode. Please check back later.
            </p>
            <button
              className="mt-6 px-5 py-2.5 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }
    return (
      <DashboardLayout
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        role={role}
        userEmail={userEmail}
        navItems={navItemsByRole[role]}
        isMaintenanceMode={isMaintenanceMode}
        children={
          <Routes>
            {viewRoutesByRole[role].map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
            <Route path="/student" element={<Navigate to={defaultPath} replace />} />
            <Route path="/admin" element={<Navigate to={defaultPath} replace />} />
            <Route path="/program-head" element={<Navigate to={defaultPath} replace />} />
            <Route path="/super-admin" element={<Navigate to={defaultPath} replace />} />
            <Route path="/login/student" element={<Navigate to={defaultPath} replace />} />
            <Route path="/login/admin" element={<Navigate to={defaultPath} replace />} />
            <Route path="/login/super-admin" element={<Navigate to={defaultPath} replace />} />
            <Route path="/login/program-head" element={<Navigate to={defaultPath} replace />} />
            <Route path="/" element={<Navigate to={defaultPath} replace />} />
            <Route 
              path="*" 
              element={
                <NotFound 
                  isAuthenticated={true} 
                  onGoHome={() => navigate(defaultPath)} 
                />
              } 
            />
          </Routes>
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100 flex items-center justify-center p-4 relative">
      {/* Minimalist Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large Circle - Top Right */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-neutral-200/40 to-transparent blur-3xl"></div>
        
        {/* Medium Circle - Bottom Left */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-neutral-300/30 to-transparent blur-3xl"></div>
        
        {/* Small Circle - Center */}
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-neutral-200/20 blur-2xl"></div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          width: '24px',
          height: '24px',
          backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {authView === 'login' ? (
          <Routes>
            <Route
              path="/"
              element={
                <LoginForm
                  forcedRole="student"
                  showRoleSelector={false}
                  title="Student Login"
                  subtitle="Enter your credentials to continue"
                  onLogin={(user) => {
                    setRole(user.role);
                    setUserEmail(user.email ?? '');
                    setCurrentView(navItemsByRole[user.role][0]?.id ?? 'overview');
                    setIsAuthenticated(true);
                    const nextDefault = viewRoutesByRole[user.role][0]?.path ?? '/';
                    navigate(nextDefault);
                  }}
                  onForgot={() => setAuthView('forgot')}
                />
              }
            />
            <Route
              path="/login/student"
              element={
                <LoginForm
                  forcedRole="student"
                  showRoleSelector={false}
                  title="Student Login"
                  subtitle="Enter your credentials to continue"
                  onLogin={(user) => {
                    setRole(user.role);
                    setUserEmail(user.email ?? '');
                    setCurrentView(navItemsByRole[user.role][0]?.id ?? 'overview');
                    setIsAuthenticated(true);
                    const nextDefault = viewRoutesByRole[user.role][0]?.path ?? '/';
                    navigate(nextDefault);
                  }}
                  onForgot={() => setAuthView('forgot')}
                />
              }
            />
            <Route path="/register/student" element={<StudentRegistrationForm />} />
            <Route path="/activity" element={<BusinessModelCanvas />} />
            <Route
              path="/login/admin"
              element={
                <StaffPortalAccessGate portal="admin">
                  <LoginForm
                    forcedRole="admin"
                    showRoleSelector={false}
                    onLogin={(user) => {
                      setRole(user.role);
                      setUserEmail(user.email ?? '');
                      setCurrentView(navItemsByRole[user.role][0]?.id ?? 'overview');
                      setIsAuthenticated(true);
                      const nextDefault = viewRoutesByRole[user.role][0]?.path ?? '/';
                      navigate(nextDefault);
                    }}
                    onForgot={() => setAuthView('forgot')}
                  />
                </StaffPortalAccessGate>
              }
            />
            <Route
              path="/login/super-admin"
              element={
                <StaffPortalAccessGate portal="super_admin">
                  <LoginForm
                    forcedRole="super_admin"
                    showRoleSelector={false}
                    onLogin={(user) => {
                      setRole(user.role);
                      setUserEmail(user.email ?? '');
                      setCurrentView(navItemsByRole[user.role][0]?.id ?? 'overview');
                      setIsAuthenticated(true);
                      const nextDefault = viewRoutesByRole[user.role][0]?.path ?? '/';
                      navigate(nextDefault);
                    }}
                  />
                </StaffPortalAccessGate>
              }
            />
            <Route
              path="/login/program-head"
              element={
                <StaffPortalAccessGate portal="program_head">
                  <LoginForm
                    forcedRole="program_head"
                    showRoleSelector={false}
                    onLogin={(user) => {
                      setRole(user.role);
                      setUserEmail(user.email ?? '');
                      setCurrentView(navItemsByRole[user.role][0]?.id ?? 'overview');
                      setIsAuthenticated(true);
                      const nextDefault = viewRoutesByRole[user.role][0]?.path ?? '/';
                      navigate(nextDefault);
                    }}
                    onForgot={() => setAuthView('forgot')}
                  />
                </StaffPortalAccessGate>
              }
            />
            {/* Redirect protected paths to the right login when not authenticated */}
            <Route path="/super-admin/*" element={<Navigate to="/login/super-admin" replace />} />
            <Route path="/program-head/*" element={<Navigate to="/login/program-head" replace />} />
            <Route path="/admin/*" element={<Navigate to="/login/admin" replace />} />
            <Route path="/student/*" element={<Navigate to="/login/student" replace />} />
            <Route path="*" element={<NotFound isAuthenticated={false} />} />
          </Routes>
        ) : (
          <ForgotPasswordForm onBack={() => setAuthView('login')} />
        )}
      </div>
    </div>
  );
}
