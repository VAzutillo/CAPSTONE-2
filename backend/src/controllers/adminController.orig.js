/* Archived legacy controller kept for reference. The active controller is adminControllerCompat.js.

const bcrypt = require('bcryptjs');
const { User, Attendance, AuditLog, Report, ScheduleChangeRequest, MasterScheduleEntry, InviteToken, SystemSettings, ArchiveRequest, Sequelize } = require('../models');
const { validatePassword } = require('../utils/passwordPolicy');

const trimIfString = (v) => (typeof v === 'string' ? v.trim() : '');
const getHandledBlocksForUser = (user) => {
  const isSuperAdmin = user?.roles?.includes?.('super_admin');
  const isProgramHead = user?.roles?.includes?.('program_head');
  /** Program Head sees institution-wide aggregates (same block resolution as super admin). */
  if (isSuperAdmin || isProgramHead) return { isSuperAdmin: true, blocks: [] };
  const rawBlocks = Array.isArray(user?.handledBlocks) ? user.handledBlocks : [];
  const blocks = rawBlocks.map((b) => trimIfString(b)).filter(Boolean);
  return { isSuperAdmin: false, blocks };
};
const logAudit = async (action, user, details, status = 'Success') => {
  try {
    await AuditLog.create({ action, user, details, status });
  } catch (e) {
    console.error('Audit log error:', e.message);
  }

  */
const getOverview = async (req, res) => {
  const emptyTrends = [
    { name: 'Mon', present: 0, absent: 0, late: 0 },
    { name: 'Tue', present: 0, absent: 0, late: 0 },
    { name: 'Wed', present: 0, absent: 0, late: 0 },
    { name: 'Thu', present: 0, absent: 0, late: 0 },
    { name: 'Fri', present: 0, absent: 0, late: 0 },
    { name: 'Sat', present: 0, absent: 0, late: 0 },
    { name: 'Sun', present: 0, absent: 0, late: 0 },
  ];
  const emptyPie = [{ name: 'No Data', value: 1, color: '#9ca3af' }];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const { isSuperAdmin: isSuperAdminUser, blocks: handledBlocks } = getHandledBlocksForUser(req.user);
    const studentFilter = {
      $and: [
        { roles: 'student' },
        { roles: { $nin: ['admin', 'super_admin', 'program_head'] } },
        // If this is a regular admin/teacher and they have handledBlocks configured,
        // only include students from those blocks.
        ...(!isSuperAdminUser && handledBlocks.length > 0
          ? [{ block: { $in: handledBlocks } }]
          : []),
      ],
    };
    const students = await User.find(studentFilter).select('_id createdAt').lean();
    const studentIds = (students || []).map((u) => u._id);
    const totalStudents = studentIds.length;
    const studentsEnrolledBeforeToday = (students || []).filter((u) => {
      const created = u.createdAt ? new Date(u.createdAt) : null;
      return !created || created < todayStart;
    }).length;
    const todayRecords =
      studentIds.length === 0
        ? []
        : await Attendance.find({
            date: { $gte: todayStart, $lt: todayEnd },
            user: { $in: studentIds },
          })
            .populate('user', 'name block')
            .lean();
    const present = todayRecords.filter((r) => r.status === 'Present').length;
    const late = todayRecords.filter((r) => r.status === 'Late').length;
    const absent = present + late > 0 ? Math.max(0, studentsEnrolledBeforeToday - present - late) : 0;
    const attendanceTrends = [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    let recordsInRange = [];
    if (studentIds.length > 0) {
      try {
        recordsInRange = await Attendance.find({
          date: { $gte: weekAgo },
          user: { $in: studentIds },
        })
          .select('date status')
          .lean();
      } catch (err) {
        console.error('Overview attendance fetch error:', err);
      }
    }
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dateStr = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}`;
      const label = `${dayStart.getMonth() + 1}/${dayStart.getDate()}`;
      const onThisDay = recordsInRange.filter((r) => {
        const rd = r.date ? new Date(r.date) : null;
        return rd && rd >= dayStart && rd < dayEnd;
      });
      const present = onThisDay.filter((r) => r.status === 'Present').length;
      const late = onThisDay.filter((r) => r.status === 'Late').length;
      const absent = Math.max(0, totalStudents - present - late);
      attendanceTrends.push({ name: label, date: dateStr, present, absent, late });
    let pieData = [
      { name: 'Present', value: present, color: '#10b981' },
      { name: 'Absent', value: absent, color: '#ef4444' },
      { name: 'Late', value: late, color: '#f59e0b' },
    ];
    if (pieData.every((d) => d.value === 0)) pieData = emptyPie;
    let alertItems = [];
    try {
      const alerts = await Report.find({ status: { $in: ['open', 'investigating'] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'email')
        .lean();
      alertItems = (alerts || []).map((r) => ({
        id: r._id != null ? String(r._id) : '',
        title: r.subject || 'Report',
        details: (r.description || '').substring(0, 80) + ((r.description || '').length > 80 ? '...' : ''),
        submittedBy: (r.user && r.user.email) || 'Unknown',
        time: r.createdAt,
      }));
    } catch (reportErr) {
      console.error('Overview reports error:', reportErr);
    const payload = {
      stats: {
        totalStudents,
        presentToday: present,
        absentToday: absent,
        lateToday: late,
      },
      attendanceTrends,
      pieData,
      alerts: alertItems,
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    twoWeeksAgo.setHours(0, 0, 0, 0);
    let weekdayRecords = [];
      weekdayRecords = await Attendance.find({
        date: { $gte: twoWeeksAgo },
        user: { $in: studentIds },
      })
        .select('date status user')
    const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const byUserDate = {};
    const studentsWithAnyAttendance = new Set();
    weekdayRecords.forEach((r) => {
      const d = r.date ? new Date(r.date) : null;
      if (!d) return;
      const uid = r.user ? String(r.user) : null;
      if (uid) studentsWithAnyAttendance.add(uid);
      const dayStr = toDateStr(d);
      const key = `${uid}|${dayStr}`;
      if (!byUserDate[key]) byUserDate[key] = { present: 0, late: 0 };
      if (r.status === 'Present') byUserDate[key].present += 1;
      if (r.status === 'Late') byUserDate[key].late += 1;
    });
    const byWeekday = { Mon: { present: 0, late: 0 }, Tue: { present: 0, late: 0 }, Wed: { present: 0, late: 0 }, Thu: { present: 0, late: 0 }, Fri: { present: 0, late: 0 } };
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    Object.keys(byUserDate).forEach((key) => {
      const parts = key.split('|');
      const dayStr = parts.length >= 2 ? parts.slice(1).join('|') : '';
      if (!dayStr) return;
      const d = new Date(dayStr);
      if (Number.isNaN(d.getTime())) return;
      const dayName = dayNames[d.getDay()];
      if (dayName === 'Sat' || dayName === 'Sun') return;
      const slot = byUserDate[key];
      if (slot.present > 0) byWeekday[dayName].present += 1;
      else if (slot.late > 0) byWeekday[dayName].late += 1;
    const studentsWithAttendanceCount = studentsWithAnyAttendance.size;
    const weekdaysInRange = 2;
    const expectedStudentDays = studentsWithAttendanceCount * weekdaysInRange;
    payload.attendanceTrendsWeekday = weekdays.map((name) => {
      const rec = byWeekday[name];
      const present = rec?.present ?? 0;
      const late = rec?.late ?? 0;
      const absent = Math.max(0, expectedStudentDays - present - late);
      return { name, present, absent, late };
    if (isSuperAdminUser) {
      const totalUsers = await User.countDocuments();
      const reportsFiled = await Report.countDocuments();
      const activeAlertsCount = await Report.countDocuments({ status: { $in: ['open', 'investigating'] } });
      const systemLoad = Math.min(99, Math.max(0, 5 + activeAlertsCount * 3 + Math.floor(reportsFiled / 20)));
      const weekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const prevWeekUsers = await User.countDocuments({ createdAt: { $lt: weekAgoDate } });
      const prevWeekReports = await Report.countDocuments({ createdAt: { $lt: weekAgoDate } });
      payload.systemStats = {
        totalUsers,
        systemLoad,
        reportsFiled,
        activeAlerts: activeAlertsCount,
        totalUsersTrend: prevWeekUsers > 0 ? `${((totalUsers - prevWeekUsers) / prevWeekUsers * 100).toFixed(1)}%` : '0%',
        systemLoadTrend: systemLoad > 15 ? '-2%' : '+1%',
        reportsFiledTrend: reportsFiled > prevWeekReports ? `+${reportsFiled - prevWeekReports}` : String(reportsFiled - prevWeekReports),
        activeAlertsTrend: activeAlertsCount > 0 ? `-${Math.min(activeAlertsCount, 2)}` : '0',
      };
    return res.json(payload);
  } catch (error) {
    console.error('Overview error:', error);
      stats: { totalStudents: 0, presentToday: 0, absentToday: 0, lateToday: 0 },
      attendanceTrends: emptyTrends,
      pieData: emptyPie,
      alerts: [],
    payload.attendanceTrendsWeekday = [
      { name: 'Mon', present: 0, absent: 0, late: 0 },
      { name: 'Tue', present: 0, absent: 0, late: 0 },
      { name: 'Wed', present: 0, absent: 0, late: 0 },
      { name: 'Thu', present: 0, absent: 0, late: 0 },
      { name: 'Fri', present: 0, absent: 0, late: 0 },
    if (req.user?.roles?.includes?.('super_admin')) {
        totalUsers: 0,
        systemLoad: 0,
        reportsFiled: 0,
        activeAlerts: 0,
        totalUsersTrend: '0%',
        systemLoadTrend: '0%',
        reportsFiledTrend: '0',
        activeAlertsTrend: '0',
const getScheduleSummary = async (req, res) => {