import React, { useEffect, useMemo, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Activity,
  FileText,
  Bell
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { API_BASE_URL } from '../../config';
import type { UserRole } from '../../types/rbac';

const defaultAttendanceData = [
  { name: 'Mon', present: 0, absent: 0, late: 0 },
  { name: 'Tue', present: 0, absent: 0, late: 0 },
  { name: 'Wed', present: 0, absent: 0, late: 0 },
  { name: 'Thu', present: 0, absent: 0, late: 0 },
  { name: 'Fri', present: 0, absent: 0, late: 0 },
  { name: 'Sat', present: 0, absent: 0, late: 0 },
  { name: 'Sun', present: 0, absent: 0, late: 0 },
];

const defaultPieData = [
  { name: 'Present', value: 1, color: '#10b981' },
  { name: 'Absent', value: 0, color: '#ef4444' },
  { name: 'Late', value: 0, color: '#f59e0b' },
];

const radarData = [
  { subject: 'Math', A: 0, fullMark: 150 },
  { subject: 'Science', A: 0, fullMark: 150 },
  { subject: 'English', A: 0, fullMark: 150 },
  { subject: 'History', A: 0, fullMark: 150 },
  { subject: 'Physics', A: 0, fullMark: 150 },
  { subject: 'Geography', A: 0, fullMark: 150 },
];

type SystemStats = {
  totalUsers: number;
  systemLoad: number;
  reportsFiled: number;
  activeAlerts: number;
  totalUsersTrend: string;
  systemLoadTrend: string;
  reportsFiledTrend: string;
  activeAlertsTrend: string;
};

export function Overview({ role = 'admin' }: { role?: UserRole }) {
  const isSuperAdmin = role === 'super_admin';
  const [stats, setStats] = useState({ totalStudents: 0, presentToday: 0, absentToday: 0, lateToday: 0 });
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [attendanceData, setAttendanceData] = useState(defaultAttendanceData);
  const [pieData, setPieData] = useState(defaultPieData);
  const [alerts, setAlerts] = useState<{ id: string; title: string; details: string; submittedBy: string; time: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/overview`, { credentials: 'include' });
        const text = await res.text();
        const data = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
        if (!data) throw new Error(res.ok ? 'Invalid response from server' : 'Could not load overview');
        if (!res.ok) throw new Error(data.error || 'Failed to load overview');
        const rawStats = data.stats || {};
        setStats({
          totalStudents: typeof rawStats.totalStudents === 'number' ? rawStats.totalStudents : 0,
          presentToday: typeof rawStats.presentToday === 'number' ? rawStats.presentToday : 0,
          absentToday: typeof rawStats.absentToday === 'number' ? rawStats.absentToday : 0,
          lateToday: typeof rawStats.lateToday === 'number' ? rawStats.lateToday : 0,
        });
        setSystemStats(data.systemStats || null);

        if (data.attendanceTrendsWeekday && Array.isArray(data.attendanceTrendsWeekday) && data.attendanceTrendsWeekday.length >= 5) {
          setAttendanceData(data.attendanceTrendsWeekday.map((d: any) => ({
            name: d.name || '',
            present: typeof d.present === 'number' ? d.present : 0,
            absent: typeof d.absent === 'number' ? d.absent : 0,
            late: typeof d.late === 'number' ? d.late : 0,
          })));
        } else {
          const rawTrends = data.attendanceTrends || [];
          const hasDateBasedTrends = rawTrends.length >= 7 && rawTrends.some((d: any) => d && (d.date || (d.name && /^\d{1,2}\/\d{1,2}$/.test(d.name))));
          const normalizedTrends = hasDateBasedTrends
            ? rawTrends.map((d: any) => ({
                name: d.name || d.date || '',
                present: typeof d.present === 'number' ? d.present : 0,
                absent: typeof d.absent === 'number' ? d.absent : 0,
                late: typeof d.late === 'number' ? d.late : 0,
              }))
            : (() => {
                const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                return dayOrder.map((name) => {
                  const found = rawTrends.find((d: any) => d && (d.name === name || (d.name && d.name.substring(0, 3) === name.substring(0, 3))));
                  return {
                    name,
                    present: found && typeof found.present === 'number' ? found.present : 0,
                    absent: found && typeof found.absent === 'number' ? found.absent : 0,
                    late: found && typeof found.late === 'number' ? found.late : 0,
                  };
                });
              })();
          setAttendanceData(normalizedTrends.length >= 7 ? normalizedTrends : defaultAttendanceData);
        }

        setPieData(data.pieData?.length ? data.pieData : defaultPieData);
        setAlerts(
          (data.alerts || []).map((a: any) => ({
            id: a.id != null ? String(a.id) : '',
            title: a.title || 'Report',
            details: a.details || '',
            submittedBy: a.submittedBy || 'Unknown',
            time: a.time ? (typeof a.time === 'string' ? a.time : new Date(a.time).toLocaleString()) : '',
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load overview');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const attendanceChartData = useMemo(() => {
    const maxVal = Math.max(
      1,
      ...attendanceData.flatMap((d) => [d.present, d.absent, d.late])
    );
    return attendanceData.map((d) => ({
      ...d,
      presentScaled: (d.present * 2) / maxVal,
      absentScaled: (d.absent * 2) / maxVal,
      lateScaled: (d.late * 2) / maxVal,
    }));
  }, [attendanceData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {isSuperAdmin ? 'System Dashboard' : 'Dashboard Overview'}
          </h1>
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          {isSuperAdmin ? 'System Dashboard' : 'Dashboard Overview'}
        </h1>
        <p className="text-neutral-500">
          {isSuperAdmin
            ? 'Welcome back, Super Admin. System status is normal.'
            : "Welcome back, here's what's happening today."}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Stats Grid - Super Admin: System cards | Admin: Attendance cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSuperAdmin && systemStats ? (
          <>
            <StatsCard 
              title="Total Users" 
              value={systemStats.totalUsers?.toLocaleString() ?? '0'} 
              trend={systemStats.totalUsersTrend} 
              trendUp={!systemStats.totalUsersTrend.startsWith('-')} 
              icon={Users} 
              color="bg-blue-500"
            />
            <StatsCard 
              title="System Load" 
              value={`${systemStats.systemLoad ?? 0}%`} 
              trend={systemStats.systemLoadTrend} 
              trendUp={false} 
              icon={Activity} 
              color="bg-slate-600"
            />
            <StatsCard 
              title="Reports Filed" 
              value={systemStats.reportsFiled?.toLocaleString() ?? '0'} 
              trend={systemStats.reportsFiledTrend} 
              trendUp={!systemStats.reportsFiledTrend.startsWith('-')} 
              icon={FileText} 
              color="bg-amber-500"
            />
            <StatsCard 
              title="Active Alerts" 
              value={systemStats.activeAlerts?.toLocaleString() ?? '0'} 
              trend={systemStats.activeAlertsTrend} 
              trendUp={false} 
              icon={Bell} 
              color="bg-red-500"
            />
          </>
        ) : (
          <>
            <StatsCard 
              title="Total Students" 
              value={stats.totalStudents?.toLocaleString() ?? '0'} 
              trend={null} 
              trendUp={true} 
              icon={Users} 
              color="bg-blue-500"
            />
            <StatsCard 
              title="Present Today" 
              value={stats.presentToday?.toLocaleString() ?? '0'} 
              trend={null} 
              trendUp={true} 
              icon={UserCheck} 
              color="bg-emerald-500"
            />
            <StatsCard 
              title="Absent Today" 
              value={stats.absentToday?.toLocaleString() ?? '0'} 
              trend={null} 
              trendUp={false} 
              icon={UserX} 
              color="bg-red-500"
            />
            <StatsCard 
              title="Late Arrivals" 
              value={stats.lateToday?.toLocaleString() ?? '0'} 
              trend={null} 
              trendUp={false} 
              icon={Clock} 
              color="bg-amber-500"
            />
          </>
        )}
      </div>

      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>Weekly attendance overview across all departments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" stroke="#737373" />
                  <YAxis stroke="#737373" domain={[0, 2]} ticks={[0, 0.5, 1, 1.5, 2]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5' }}
                    formatter={(value: number, name: string, props: any) => {
                      const payload = props.payload;
                      const key = String(name).toLowerCase().includes('present') ? 'present' : String(name).toLowerCase().includes('absent') ? 'absent' : 'late';
                      return [payload[key] ?? value, name];
                    }}
                    labelFormatter={(label) => label}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="presentScaled" name="Present" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="absentScaled" name="Absent" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="lateScaled" name="Late" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {attendanceData.every((d) => d.present === 0 && d.absent === 0 && d.late === 0) && (
              <p className="text-xs text-neutral-500 mt-2">
                No attendance in the last 2 weeks (Mon–Fri). Values will appear when students check in (IoT device or student panel).
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
            <CardDescription>Status distribution for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section 2 & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>Average attendance by department</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                   <PolarGrid stroke="#e5e5e5" />
                   <PolarAngleAxis dataKey="subject" tick={{ fill: '#737373', fontSize: 12 }} />
                   <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#737373" />
                   <Radar name="Attendance" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.5} />
                   <Legend />
                 </RadarChart>
               </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent {isSuperAdmin ? 'System ' : ''}Alerts & Anomalies</CardTitle>
            <CardDescription>
              {isSuperAdmin ? 'Critical system events and anomalies.' : 'Student-reported issues (Report an Issue). Shown when status is open or investigating.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <p className="text-sm text-neutral-500 py-4">No recent alerts. Alerts appear here when students submit reports from the student panel.</p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 p-4 rounded-lg bg-red-50 border border-red-100">
                    <div className="p-2 bg-white rounded-full border border-red-100 shadow-sm">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900">{alert.title}</h4>
                      <p className="text-sm text-neutral-600 mt-1">{alert.details}</p>
                      <p className="text-xs text-neutral-500 mt-2 font-medium">
                        {alert.submittedBy} • {alert.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, trend, trendUp, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend != null && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
