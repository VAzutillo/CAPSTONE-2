const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { authenticate, requireRole, requireSuperAdmin, requireProgramHeadOrSuper } = require('../middleware/auth');
const {
  sequelize,
  User,
  Attendance,
  Report,
  ScheduleChangeRequest,
  MasterScheduleEntry,
  InviteToken,
  SystemSettings,
  ArchiveRequest,
  AuditLog,
} = require('../models');

const trimIfString = (value) => (typeof value === 'string' ? value.trim() : '');
const hasRole = (user, role) => Array.isArray(user?.roles) && user.roles.includes(role);
const isStudent = (user) => hasRole(user, 'student') && !hasRole(user, 'admin') && !hasRole(user, 'super_admin') && !hasRole(user, 'program_head');
const normalizeDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};
const dateKey = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const roleLabel = (role) => {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'program_head') return 'Program Head';
  if (role === 'admin') return 'Admin';
  return 'Student';
};
const serializeUser = (user) => ({
  id: user.id,
  name: user.name || '—',
  email: user.email,
  role: Array.isArray(user.roles) ? user.roles[0] : 'student',
  roleLabel: roleLabel(Array.isArray(user.roles) ? user.roles[0] : 'student'),
  department: user.block || '—',
  handledBlocks: Array.isArray(user.handledBlocks) ? user.handledBlocks : [],
});

async function listStudents() {
  const users = await User.findAll({ attributes: ['id', 'name', 'email', 'block', 'roles', 'handledBlocks'] });
  return users.filter((user) => Array.isArray(user.roles) && user.roles.includes('student'));
}

async function getMaintenanceMode() {
  try {
    const doc = await SystemSettings.findOne({ where: { key: 'maintenanceMode' } });
    return !!(doc && doc.value);
  } catch {
    return false;
  }
}

async function ensureSystemSetting(key, value) {
  const [row] = await SystemSettings.findOrCreate({ where: { key }, defaults: { value } });
  row.value = value;
  await row.save();
  return row;
}

router.use(authenticate);
router.use(requireRole(['admin', 'super_admin', 'program_head']));

router.get('/overview', async (req, res) => {
  try {
    const students = await listStudents();
    const studentIds = students.map((student) => student.id);
    const todayStart = normalizeDate();
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const attendanceRows = studentIds.length > 0
      ? await Attendance.findAll({
          where: {
            userId: { [Op.in]: studentIds },
            date: { [Op.gte]: todayStart, [Op.lt]: todayEnd },
          },
        })
      : [];

    const presentToday = attendanceRows.filter((row) => row.status === 'Present').length;
    const lateToday = attendanceRows.filter((row) => row.status === 'Late').length;
    const absentToday = Math.max(0, students.length - presentToday - lateToday);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekRows = studentIds.length > 0
      ? await Attendance.findAll({
          where: {
            userId: { [Op.in]: studentIds },
            date: { [Op.gte]: weekStart, [Op.lt]: todayEnd },
          },
        })
      : [];

    const byDate = new Map();
    weekRows.forEach((row) => {
      const key = dateKey(row.date);
      if (!byDate.has(key)) byDate.set(key, { present: 0, late: 0 });
      const bucket = byDate.get(key);
      if (row.status === 'Present') bucket.present += 1;
      if (row.status === 'Late') bucket.late += 1;
    });

    const attendanceTrends = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(todayStart);
      day.setDate(day.getDate() - i);
      const key = dateKey(day);
      const bucket = byDate.get(key) || { present: 0, late: 0 };
      attendanceTrends.push({
        name: day.toLocaleDateString('en-US', { weekday: 'short' }),
        date: key,
        present: bucket.present,
        absent: Math.max(0, students.length - bucket.present - bucket.late),
        late: bucket.late,
      });
    }

    const reportsFiled = await Report.count();
    const activeAlerts = await Report.count({ where: { status: { [Op.in]: ['open', 'investigating'] } } });
    const totalUsers = await User.count();

    res.json({
      stats: {
        totalStudents: students.length,
        presentToday,
        absentToday,
        lateToday,
      },
      attendanceTrends,
      attendanceTrendsWeekday: [
        { name: 'Mon', present: 0, absent: 0, late: 0 },
        { name: 'Tue', present: 0, absent: 0, late: 0 },
        { name: 'Wed', present: 0, absent: 0, late: 0 },
        { name: 'Thu', present: 0, absent: 0, late: 0 },
        { name: 'Fri', present: 0, absent: 0, late: 0 },
      ],
      pieData: [
        { name: 'Present', value: presentToday, color: '#10b981' },
        { name: 'Absent', value: absentToday, color: '#ef4444' },
        { name: 'Late', value: lateToday, color: '#f59e0b' },
      ],
      alerts: [],
      systemStats: hasRole(req.user, 'super_admin')
        ? {
            totalUsers,
            systemLoad: Math.min(99, Math.max(0, 5 + activeAlerts * 3 + Math.floor(reportsFiled / 20))),
            reportsFiled,
            activeAlerts,
            totalUsersTrend: '0%',
            systemLoadTrend: '0%',
            reportsFiledTrend: '0',
            activeAlertsTrend: '0',
          }
        : undefined,
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ error: 'Failed to load overview' });
  }
});

router.get('/available-blocks', requireSuperAdmin, async (req, res) => {
  try {
    const users = await listStudents();
    const blocks = [...new Set(users.map((user) => trimIfString(user.block)).filter(Boolean))].sort();
    res.json({ blocks });
  } catch (error) {
    console.error('Available blocks error:', error);
    res.status(500).json({ error: 'Failed to fetch blocks' });
  }
});

router.get('/users', requireSuperAdmin, async (req, res) => {
  try {
    const search = trimIfString(req.query.search);
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    const filtered = search
      ? users.filter((user) => [user.name, user.email, user.block].some((field) => trimIfString(field).toLowerCase().includes(search.toLowerCase())))
      : users;
    res.json({ users: filtered.map(serializeUser) });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role, handledBlocks } = req.body;
    if (!trimIfString(email) || !trimIfString(password)) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: trimIfString(name),
      email: trimIfString(email).toLowerCase(),
      password: hashedPassword,
      roles: [role === 'super_admin' || role === 'program_head' || role === 'student' ? role : 'admin'],
      handledBlocks: Array.isArray(handledBlocks) ? handledBlocks.map(trimIfString).filter(Boolean) : [],
    });

    res.status(201).json({ message: 'User created', user: serializeUser(user) });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.patch('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { name, email, role, handledBlocks } = req.body;
    if (typeof name === 'string') user.name = name.trim();
    if (typeof email === 'string' && email.trim()) user.email = email.trim().toLowerCase();
    if (role === 'admin' || role === 'student' || role === 'program_head' || role === 'super_admin') user.roles = [role];
    if (role === 'admin') user.handledBlocks = Array.isArray(handledBlocks) ? handledBlocks.map(trimIfString).filter(Boolean) : [];
    if (role === 'student' || role === 'program_head' || role === 'super_admin') user.handledBlocks = [];
    await user.save();
    res.json({ message: 'User updated', user: serializeUser(user) });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.get('/master-schedule', async (req, res) => {
  try {
    const block = trimIfString(req.query.block);
    const where = block ? { block } : {};
    const entries = await MasterScheduleEntry.findAll({ where, order: [['block', 'ASC'], ['order', 'ASC'], ['courseName', 'ASC']] });
    res.json({ entries: entries.map((entry) => ({
      id: entry.id,
      block: entry.block,
      courseName: entry.courseName,
      schedule: entry.schedule,
      room: entry.room,
      assignedProfessorEmail: entry.assignedProfessorEmail || '',
      graceOverrideMinutes: entry.graceOverrideMinutes ?? 0,
      order: entry.order ?? 0,
    })) });
  } catch (error) {
    console.error('List master schedule error:', error);
    res.status(500).json({ error: 'Failed to load master schedule' });
  }
});

router.post('/master-schedule', requireProgramHeadOrSuper, async (req, res) => {
  try {
    const payload = {
      block: trimIfString(req.body.block),
      courseName: trimIfString(req.body.courseName),
      schedule: trimIfString(req.body.schedule),
      room: trimIfString(req.body.room),
      assignedProfessorEmail: trimIfString(req.body.assignedProfessorEmail),
      graceOverrideMinutes: Number(req.body.graceOverrideMinutes) || 0,
      order: Number(req.body.order) || 0,
    };
    if (!payload.block || !payload.courseName) return res.status(400).json({ error: 'Block and course name are required' });
    const entry = await MasterScheduleEntry.create(payload);
    res.status(201).json({ message: 'Master schedule entry created', entry });
  } catch (error) {
    console.error('Create master schedule error:', error);
    res.status(500).json({ error: 'Failed to create master schedule entry' });
  }
});

router.patch('/master-schedule/:id', requireProgramHeadOrSuper, async (req, res) => {
  try {
    const entry = await MasterScheduleEntry.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    ['block', 'courseName', 'schedule', 'room', 'assignedProfessorEmail'].forEach((field) => {
      if (typeof req.body[field] === 'string') entry[field] = req.body[field].trim();
    });
    if (typeof req.body.graceOverrideMinutes !== 'undefined') entry.graceOverrideMinutes = Number(req.body.graceOverrideMinutes) || 0;
    if (typeof req.body.order !== 'undefined') entry.order = Number(req.body.order) || 0;
    await entry.save();
    res.json({ message: 'Master schedule entry updated', entry });
  } catch (error) {
    console.error('Update master schedule error:', error);
    res.status(500).json({ error: 'Failed to update master schedule entry' });
  }
});

router.delete('/master-schedule/:id', requireProgramHeadOrSuper, async (req, res) => {
  try {
    const entry = await MasterScheduleEntry.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    await entry.destroy();
    res.json({ message: 'Master schedule entry deleted' });
  } catch (error) {
    console.error('Delete master schedule error:', error);
    res.status(500).json({ error: 'Failed to delete master schedule entry' });
  }
});

router.post('/master-schedule/sync', requireProgramHeadOrSuper, async (req, res) => {
  try {
    const students = await listStudents();
    const blocks = [...new Set(students.map((student) => trimIfString(student.block)).filter(Boolean))];
    for (const block of blocks) {
      const entries = await MasterScheduleEntry.findAll({ where: { block }, order: [['order', 'ASC'], ['courseName', 'ASC']] });
      const courses = entries.map((entry) => ({
        courseName: entry.courseName || '',
        schedule: entry.schedule || '',
        room: entry.room || '',
      }));
      const blockStudents = students.filter((student) => trimIfString(student.block) === block);
      for (const student of blockStudents) {
        student.comCourses = courses;
        student.comCourse = courses[0]?.courseName || '';
        student.comSchedule = courses[0]?.schedule || '';
        student.comRoom = courses[0]?.room || '';
        await student.save();
      }
    }
    res.json({ message: 'Blocks synced', syncedBlocks: blocks.length });
  } catch (error) {
    console.error('Sync blocks error:', error);
    res.status(500).json({ error: 'Failed to sync blocks' });
  }
});

router.get('/schedule-summary', async (req, res) => {
  try {
    const teacherName = trimIfString(req.user?.name) || '';
    const users = await listStudents();
    const blockMap = new Map();
    users.forEach((user) => {
      const block = trimIfString(user.block) || 'Unknown';
      if (!blockMap.has(block)) blockMap.set(block, []);
      blockMap.get(block).push(user);
    });

    const blocks = [];
    for (const [block, blockStudents] of blockMap.entries()) {
      const entries = await MasterScheduleEntry.findAll({ where: { block }, order: [['order', 'ASC'], ['courseName', 'ASC']] });
      blocks.push({
        block,
        studentCount: blockStudents.length,
        courses: entries.map((entry) => ({
          courseName: entry.courseName || '',
          schedule: entry.schedule || '',
          room: entry.room || '',
        })),
      });
    }

    blocks.sort((a, b) => a.block.localeCompare(b.block));
    res.json({ teacherName, blocks });
  } catch (error) {
    console.error('Schedule summary error:', error);
    res.status(500).json({ error: 'Failed to load schedule summary' });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const { startDate, endDate, block } = req.query;
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date[Op.lte] = end;
      }
    }

    const attendanceRows = await Attendance.findAll({ where, include: [{ model: User, attributes: ['id', 'block', 'name', 'email'] }] });
    const blockFilter = trimIfString(block);
    const grouped = new Map();

    attendanceRows.forEach((row) => {
      const userBlock = trimIfString(row.User?.block);
      if (blockFilter && userBlock !== blockFilter) return;
      const key = `${dateKey(row.date)}|${userBlock || 'Unknown'}`;
      if (!grouped.has(key)) {
        grouped.set(key, { date: dateKey(row.date), class: userBlock || 'Unknown', totalStudents: 0, present: 0, absent: 0, late: 0 });
      }
      const bucket = grouped.get(key);
      bucket.totalStudents += 1;
      if (row.status === 'Present') bucket.present += 1;
      if (row.status === 'Late') bucket.late += 1;
      if (row.status === 'Absent') bucket.absent += 1;
    });

    const reports = [...grouped.values()].map((item, index) => ({
      id: `${item.date}-${item.class}-${index}`,
      date: item.date,
      class: item.class,
      totalStudents: item.totalStudents,
      present: item.present,
      absent: item.absent,
      late: item.late,
      status: item.present > item.late ? 'Average' : 'Needs Attention',
    }));

    res.json({ reports });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Failed to load reports' });
  }
});

router.get('/reports/block-details', async (req, res) => {
  try {
    const block = trimIfString(req.query.block || req.query.class);
    const date = trimIfString(req.query.date);
    const users = await User.findAll({ where: { block }, attributes: ['id', 'name', 'idNumber', 'email', 'block', 'roles'] });
    const targetDate = date ? normalizeDate(date) : null;

    let attendanceMap = new Map();
    if (block && targetDate) {
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 1);
      const rows = await Attendance.findAll({
        where: { date: { [Op.gte]: targetDate, [Op.lt]: endDate } },
        include: [{ model: User, attributes: ['id', 'block'] }],
      });
      attendanceMap = new Map(rows.map((row) => [row.userId, row.status]));
    }

    const students = users.map((user) => ({
      id: user.id,
      name: user.name || '—',
      idNumber: user.idNumber || '—',
      email: user.email || '—',
      block: user.block || block || '—',
      status: attendanceMap.get(user.id) || 'Absent',
    }));

    res.json({ students });
  } catch (error) {
    console.error('Block details error:', error);
    res.status(500).json({ error: 'Failed to load block details' });
  }
});

router.get('/archive-requests', async (req, res) => {
  try {
    const requests = await ArchiveRequest.findAll({ order: [['createdAt', 'DESC']] });
    res.json({
      requests: requests.map((request) => ({
        id: request.id,
        studentName: request.studentName,
        studentBlock: request.studentBlock,
        reason: request.reason,
        status: request.status,
      })),
    });
  } catch (error) {
    console.error('Archive requests error:', error);
    res.status(500).json({ error: 'Failed to load archive requests' });
  }
});

router.post('/archive-requests', async (req, res) => {
  try {
    const { studentName, studentBlock, reason } = req.body;
    if (!trimIfString(studentName) || !trimIfString(studentBlock)) {
      return res.status(400).json({ error: 'Student name and block are required' });
    }
    const request = await ArchiveRequest.create({
      studentName: trimIfString(studentName),
      studentBlock: trimIfString(studentBlock),
      reason: trimIfString(reason),
      status: 'Pending',
    });
    res.status(201).json({ message: 'Archive request created', request });
  } catch (error) {
    console.error('Create archive request error:', error);
    res.status(500).json({ error: 'Failed to create archive request' });
  }
});

router.patch('/archive-requests/:id', requireSuperAdmin, async (req, res) => {
  try {
    const request = await ArchiveRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ error: 'Archive request not found' });
    if (typeof req.body.status === 'string') request.status = req.body.status;
    await request.save();
    res.json({ message: 'Archive request updated', request });
  } catch (error) {
    console.error('Update archive request error:', error);
    res.status(500).json({ error: 'Failed to update archive request' });
  }
});

router.get('/schedule-change-requests', async (req, res) => {
  try {
    const requests = await ScheduleChangeRequest.findAll({ include: [{ model: User, attributes: ['id', 'name', 'block', 'email'] }], order: [['createdAt', 'DESC']] });
    res.json({
      requests: requests.map((request) => ({
        id: request.id,
        studentName: request.User?.name || '',
        block: request.User?.block || '',
        courseName: request.courseName,
        currentSchedule: request.currentSchedule || '',
        currentRoom: request.currentRoom || '',
        requestedSchedule: request.requestedSchedule || '',
        requestedRoom: request.requestedRoom || '',
        status: request.status,
        createdAt: request.createdAt,
      })),
    });
  } catch (error) {
    console.error('Schedule change request list error:', error);
    res.status(500).json({ error: 'Failed to load schedule change requests' });
  }
});

router.patch('/schedule-change-requests/:id', async (req, res) => {
  try {
    const request = await ScheduleChangeRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ error: 'Schedule change request not found' });
    if (typeof req.body.status === 'string' && ['approved', 'rejected', 'pending'].includes(req.body.status)) {
      request.status = req.body.status;
    }
    if (typeof req.body.adminNote === 'string') request.adminNote = req.body.adminNote.trim();
    await request.save();
    res.json({ message: 'Schedule change request updated', request });
  } catch (error) {
    console.error('Update schedule change request error:', error);
    res.status(500).json({ error: 'Failed to update schedule change request' });
  }
});

router.get('/audit-logs', requireSuperAdmin, async (req, res) => {
  try {
    const { search = '', limit = 50 } = req.query;
    const logs = await AuditLog.findAll({ order: [['createdAt', 'DESC']], limit: Math.min(Number(limit) || 50, 200) });
    const normalized = trimIfString(search).toLowerCase();
    const filtered = normalized
      ? logs.filter((log) => [log.action, log.user, log.details].some((field) => trimIfString(field).toLowerCase().includes(normalized)))
      : logs;
    res.json({
      logs: filtered.map((log) => ({
        id: log.id,
        action: log.action,
        user: log.user,
        details: log.details,
        status: log.status,
        time: log.createdAt,
      })),
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

router.get('/app-reports', requireSuperAdmin, async (req, res) => {
  try {
    const reports = await Report.findAll({ include: [{ model: User, attributes: ['email', 'name'] }], order: [['createdAt', 'DESC']] });
    res.json({
      reports: reports.map((report) => ({
        id: report.id,
        reportId: `REP-${report.createdAt.getFullYear()}-${String(report.id).slice(-3)}`,
        title: report.subject,
        category: report.category,
        description: report.description,
        severity: report.severity,
        status: report.status,
        submittedBy: report.User?.email || 'Unknown',
        date: report.createdAt.toISOString().slice(0, 10),
      })),
    });
  } catch (error) {
    console.error('App reports error:', error);
    res.status(500).json({ error: 'Failed to load app reports' });
  }
});

router.patch('/app-reports/:id', requireSuperAdmin, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (typeof req.body.status === 'string' && req.body.status.trim()) report.status = req.body.status.trim().toLowerCase();
    await report.save();
    res.json({ message: 'Report updated', report });
  } catch (error) {
    console.error('Update app report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

router.get('/settings', requireSuperAdmin, async (req, res) => {
  try {
    const docs = await SystemSettings.findAll();
    const settings = {};
    docs.forEach((doc) => {
      settings[doc.key] = doc.value;
    });
    if (typeof settings.maintenanceMode === 'undefined') settings.maintenanceMode = false;
    if (typeof settings.orgName === 'undefined') settings.orgName = 'University of Technology';
    if (typeof settings.attendanceThreshold === 'undefined') settings.attendanceThreshold = 75;
    if (typeof settings.lateTolerance === 'undefined') settings.lateTolerance = 15;
    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', requireSuperAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object required' });
    }

    for (const [key, value] of Object.entries(settings)) {
      await ensureSystemSetting(key, value);
    }

    const docs = await SystemSettings.findAll();
    const out = {};
    docs.forEach((doc) => {
      out[doc.key] = doc.value;
    });
    res.json({ message: 'Settings updated', settings: out });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.post('/invites', requireSuperAdmin, async (req, res) => {
  try {
    const { email, expiresInDays = 7 } = req.body;
    const tokenResult = await InviteToken.createInvite({
      email: trimIfString(email) || null,
      createdById: req.user?.id,
      expiresInDays: Math.min(Math.max(Number(expiresInDays) || 7, 1), 30),
      maxUses: 50,
    });
    const frontendUrl = (typeof req.get === 'function' && req.get('origin')) || process.env.FRONTEND_URL || 'http://localhost:3001';
    const inviteLink = `${frontendUrl}/register/student?token=${tokenResult.token}`;
    res.status(201).json({
      message: 'Invite link created',
      inviteLink,
      token: tokenResult.token,
      expiresAt: tokenResult.expiresAt,
    });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Failed to create invite link' });
  }
});

module.exports = router;