const { User, Attendance, AuditLog, Report, ScheduleChangeRequest, MasterScheduleEntry, InviteToken, SystemSettings, ArchiveRequest, Sequelize } = require('../models');

const getNotificationSummary = async (req, res) => {
  try {
    const user = req.user;
    const roles = Array.isArray(user.roles) ? user.roles : [];
    const isStudent = roles.includes('student') && !roles.includes('admin') && !roles.includes('super_admin');
    const isSuperAdmin = roles.includes('super_admin');
    const isAdmin = roles.includes('admin') && !isSuperAdmin;
    const items = [];
    if (isStudent) {
      const pending = await ScheduleChangeRequest.countDocuments({
        user: user._id,
        status: 'pending',
      });
      if (pending > 0) {
        items.push({
          id: 'student-schedule-requests',
          label: `You have ${pending} schedule change request${pending > 1 ? 's' : ''} pending`,
          count: pending,
          targetView: 'student-schedule',
        });
      }
    } else if (isAdmin || isSuperAdmin) {
      const pendingSchedule = await ScheduleChangeRequest.countDocuments({ status: 'pending' });
      if (pendingSchedule > 0) {
          id: 'schedule-change-requests',
          label: `${pendingSchedule} schedule change request${pendingSchedule > 1 ? 's' : ''} pending`,
          count: pendingSchedule,
          targetView: 'schedule-requests',
      const pendingArchives = await ArchiveRequest.countDocuments({ status: 'Pending' });
      if (pendingArchives > 0) {
          id: 'archive-requests',
          label: `${pendingArchives} archive request${pendingArchives > 1 ? 's' : ''} pending`,
          count: pendingArchives,
          targetView: 'archive-requests',
      const openReports = await Report.countDocuments({
        status: { $in: ['open', 'investigating'] },
      if (openReports > 0 && isSuperAdmin) {
          id: 'app-reports',
          label: `${openReports} app report${openReports > 1 ? 's' : ''} open`,
          count: openReports,
          targetView: 'app-reports',
    }
    const totalCount = items.reduce((sum, item) => sum + (item.count || 0), 0);
    return res.json({ items, totalCount });
  } catch (error) {
    console.error('Notification summary error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};
module.exports = { getNotificationSummary };
