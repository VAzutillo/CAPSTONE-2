const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { User, Report, ScheduleChangeRequest, ArchiveRequest } = require('../models');

const isStudent = (user) => Array.isArray(user?.roles) && user.roles.includes('student') && !user.roles.includes('admin') && !user.roles.includes('super_admin');
const isSuperAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('super_admin');
const isAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('admin') && !user.roles.includes('super_admin');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const items = [];
    if (isStudent(req.user)) {
      const pending = await ScheduleChangeRequest.count({ where: { userId: req.user.id, status: 'pending' } });
      if (pending > 0) {
        items.push({ id: 'student-schedule-requests', label: `You have ${pending} schedule change request${pending > 1 ? 's' : ''} pending`, count: pending, targetView: 'student-schedule' });
      }
    } else if (isAdmin(req.user) || isSuperAdmin(req.user)) {
      const pendingSchedule = await ScheduleChangeRequest.count({ where: { status: 'pending' } });
      if (pendingSchedule > 0) {
        items.push({ id: 'schedule-change-requests', label: `${pendingSchedule} schedule change request${pendingSchedule > 1 ? 's' : ''} pending`, count: pendingSchedule, targetView: 'schedule-requests' });
      }

      const pendingArchives = await ArchiveRequest.count({ where: { status: 'Pending' } });
      if (pendingArchives > 0) {
        items.push({ id: 'archive-requests', label: `${pendingArchives} archive request${pendingArchives > 1 ? 's' : ''} pending`, count: pendingArchives, targetView: 'archive-requests' });
      }

      const openReports = await Report.count({ where: { status: { [Op.in]: ['open', 'investigating'] } } });
      if (openReports > 0 && isSuperAdmin(req.user)) {
        items.push({ id: 'app-reports', label: `${openReports} app report${openReports > 1 ? 's' : ''} open`, count: openReports, targetView: 'app-reports' });
      }
    }

    const totalCount = items.reduce((sum, item) => sum + (item.count || 0), 0);
    res.json({ items, totalCount });
  } catch (error) {
    console.error('Notification summary error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;