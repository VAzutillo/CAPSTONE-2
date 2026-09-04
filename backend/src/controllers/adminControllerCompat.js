const bcrypt = require('bcryptjs');
const { User, Attendance, AuditLog, Report, ScheduleChangeRequest, MasterScheduleEntry, InviteToken, SystemSettings, ArchiveRequest, Sequelize } = require('../models');
const { Op } = Sequelize;

const trimIfString = (v) => (typeof v === 'string' ? v.trim() : '');
const getHandledBlocksForUser = (user) => {
  const isSuperAdmin = Array.isArray(user?.roles) && user.roles.includes('super_admin');
  const isProgramHead = Array.isArray(user?.roles) && user.roles.includes('program_head');
  if (isSuperAdmin || isProgramHead) return { isSuperAdmin: true, blocks: [] };
  const rawBlocks = Array.isArray(user?.handledBlocks) ? user.handledBlocks : [];
  const blocks = rawBlocks.map((b) => trimIfString(b)).filter(Boolean);
  return { isSuperAdmin: false, blocks };
};

const logAudit = async (action, user, details, status = 'Success') => {
  try {
    await AuditLog.create({ action, user: user?.id ? String(user.id) : (user?.email || 'system'), details: details || '', status });
  } catch (e) {
    console.error('Audit log error:', e.message || e);
  }
};

const getOverview = async (req, res) => {
  try {
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

    const { isSuperAdmin: isSuperAdminUser, blocks: handledBlocks } = getHandledBlocksForUser(req.user || {});

    // Fetch students (simple approach: load candidates and filter in JS)
    const allUsers = await User.findAll({ attributes: ['id', 'roles', 'createdAt', 'block', 'email'] });
    const students = allUsers.filter((u) => Array.isArray(u.roles) && u.roles.includes('student') && !u.roles.includes('admin') && !u.roles.includes('super_admin') && !u.roles.includes('program_head'));
    const allowedStudents = !isSuperAdminUser && handledBlocks.length > 0 ? students.filter((s) => handledBlocks.includes((s.block || '').trim())) : students;
    const studentIds = allowedStudents.map((s) => s.id);
    const totalStudents = allowedStudents.length;
    const studentsEnrolledBeforeToday = allowedStudents.filter((u) => !u.createdAt || new Date(u.createdAt) < todayStart).length;

    // Today's attendance
    let todayRecords = [];
    if (studentIds.length > 0) {
      todayRecords = await Attendance.findAll({
        where: { date: { [Op.gte]: todayStart, [Op.lt]: todayEnd }, userId: { [Op.in]: studentIds } },
        include: [{ model: User, attributes: ['name', 'block'] }]
      });
    }
    const present = todayRecords.filter((r) => r.status === 'Present').length;
    const late = todayRecords.filter((r) => r.status === 'Late').length;
    const absent = present + late > 0 ? Math.max(0, studentsEnrolledBeforeToday - present - late) : 0;

    // Week trends
    const attendanceTrends = [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    let recordsInRange = [];
    if (studentIds.length > 0) {
      recordsInRange = await Attendance.findAll({ where: { date: { [Op.gte]: weekAgo }, userId: { [Op.in]: studentIds } } });
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
      const p = onThisDay.filter((r) => r.status === 'Present').length;
      const l = onThisDay.filter((r) => r.status === 'Late').length;
      const a = Math.max(0, totalStudents - p - l);
      attendanceTrends.push({ name: label, date: dateStr, present: p, absent: a, late: l });
    }

    let pieData = [
      { name: 'Present', value: present, color: '#10b981' },
      { name: 'Absent', value: absent, color: '#ef4444' },
      { name: 'Late', value: late, color: '#f59e0b' },
    ];
    if (pieData.every((d) => d.value === 0)) pieData = emptyPie;

    // Alerts
    const alertsRaw = await Report.findAll({ where: { status: { [Op.in]: ['open', 'investigating'] } }, order: [['createdAt', 'DESC']], limit: 5, include: [{ model: User, attributes: ['email'] }] });
    const alertItems = (alertsRaw || []).map((r) => ({ id: String(r.id), title: r.subject || 'Report', details: (r.description || '').substring(0, 80) + ((r.description || '').length > 80 ? '...' : ''), submittedBy: (r.User && r.User.email) || 'Unknown', time: r.createdAt }));

    const payload = {
      stats: { totalStudents, presentToday: present, absentToday: absent, lateToday: late },
      attendanceTrends,
      pieData,
      alerts: alertItems,
    };

    // Basic system stats for super admin
    if (isSuperAdminUser) {
      const totalUsers = await User.count();
      const reportsFiled = await Report.count();
      const activeAlertsCount = await Report.count({ where: { status: { [Op.in]: ['open', 'investigating'] } } });
      payload.systemStats = { totalUsers, reportsFiled, activeAlerts: activeAlertsCount };
    }

    return res.json(payload);
  } catch (error) {
    console.error('Overview error:', error);
    return res.status(500).json({
      stats: { totalStudents: 0, presentToday: 0, absentToday: 0, lateToday: 0 },
      attendanceTrends: [],
      pieData: [{ name: 'No Data', value: 1, color: '#9ca3af' }],
      alerts: [],
    });
  }
};

// Simple not-implemented stub helper
const notImpl = (name) => async (req, res) => res.status(501).json({ error: `${name} not implemented yet` });

module.exports = {
  getOverview,
  getScheduleSummary: notImpl('getScheduleSummary'),
  getReports: notImpl('getReports'),
  getReportBlockDetails: notImpl('getReportBlockDetails'),
  getAvailableBlocks: notImpl('getAvailableBlocks'),
  listArchiveRequests: notImpl('listArchiveRequests'),
  createArchiveRequest: notImpl('createArchiveRequest'),
  updateArchiveRequest: notImpl('updateArchiveRequest'),
  listUsers: async (req, res) => {
    try {
      const { search } = req.query;
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '25', 10)));
      const offset = (page - 1) * limit;

      const where = {};
      if (search && typeof search === 'string' && search.trim()) {
        const s = `%${search.trim()}%`;
        where[Op.or] = [
          { name: { [Op.like]: s } },
          { email: { [Op.like]: s } },
          { block: { [Op.like]: s } },
        ];
      }

      const total = await User.count({ where });
      const users = await User.findAll({ where, attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']], offset, limit });

      return res.json({ users, total, page, limit });
    } catch (err) {
      console.error('listUsers error:', err);
      return res.status(500).json({ error: 'Failed to list users' });
    }
  },
  createUser: async (req, res) => {
    try {
      const { name, email, password, roles = ['student'], block = '' } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already in use' });
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ name: name || '', email, password: hashed, roles: Array.isArray(roles) ? roles : [roles], block: block || '' });
      const out = user.toJSON();
      delete out.password;
      return res.status(201).json({ user: out });
    } catch (err) {
      console.error('createUser error:', err);
      return res.status(500).json({ error: 'Failed to create user' });
    }
  },
  updateUser: notImpl('updateUser'),
  listAuditLogs: notImpl('listAuditLogs'),
  listAppReports: notImpl('listAppReports'),
  updateAppReport: notImpl('updateAppReport'),
  getSettings: notImpl('getSettings'),
  updateSettings: notImpl('updateSettings'),
  createInvite: notImpl('createInvite'),
  listScheduleChangeRequests: notImpl('listScheduleChangeRequests'),
  updateScheduleChangeRequest: notImpl('updateScheduleChangeRequest'),
};
