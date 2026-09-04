const bcrypt = require('bcryptjs');
const { User, Attendance, Report, ScheduleChangeRequest } = require('../models');
const { Sequelize } = require('sequelize');
const { Op } = Sequelize;

const trimIfString = (value) => (typeof value === 'string' ? value.trim() : '');

const getProfile = async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      profile: {
        name: user.name || '',
        block: user.block || '',
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, block } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (typeof name === 'string') {
      user.name = name.trim();
    }
    if (typeof block === 'string') {
      user.block = block.trim();
    }
    await user.save();
    return res.json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation do not match' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const user = req.user;
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ error: 'Failed to update password' });
  }
};

const recordAttendance = async (req, res) => {
  try {
    const { status = 'Present', note = '' } = req.body;
    const allowedStatuses = ['Present', 'Late', 'Absent'];
    const finalStatus = allowedStatuses.includes(status) ? status : 'Present';
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const existing = await Attendance.findOne({
      where: {
        userId: req.user.id,
        date: { [Op.gte]: todayStart, [Op.lt]: todayEnd }
      }
    });

    if (existing) {
      return res.status(409).json({
        error: 'Attendance already recorded for today',
        record: {
          id: existing.id,
          date: existing.date.toISOString().slice(0, 10),
          status: existing.status,
          time: existing.time || '-',
          note: existing.note || '',
        },
      });
    }

    const timeStr = now.toTimeString().slice(0, 5);
    const record = await Attendance.create({
      userId: req.user.id,
      date: todayStart,
      status: finalStatus,
      time: timeStr,
      note: trimIfString(note),
    });

    return res.status(201).json({
      message: 'Attendance recorded',
      record: {
        id: record.id,
        date: record.date.toISOString().slice(0, 10),
        status: record.status,
        time: record.time || '-',
        note: record.note || '',
      }
    });
  } catch (error) {
    console.error('Record attendance error:', error);
    return res.status(500).json({ error: 'Failed to record attendance' });
  }
};

const getAttendance = async (req, res) => {
  try {
    const records = await Attendance.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });

    const stats = records.reduce(
      (acc, record) => {
        if (record.status === 'Present') acc.presentDays += 1;
        if (record.status === 'Late') acc.lateDays += 1;
        if (record.status === 'Absent') acc.absentDays += 1;
        return acc;
      },
      { presentDays: 0, lateDays: 0, absentDays: 0 }
    );

    const normalizedRecords = records.map((record) => ({
      id: record.id,
      date: record.date ? record.date.toISOString().slice(0, 10) : '',
      status: record.status,
      time: trimIfString(record.time) || '-',
      note: trimIfString(record.note),
    }));

    return res.json({ stats, records: normalizedRecords });
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

const getCourses = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['comCourses'] });
    const courses = Array.isArray(user.comCourses) ? user.comCourses : [];

    const pending = await ScheduleChangeRequest.findAll({
      where: { userId: req.user.id, status: 'pending' },
      attributes: ['id', 'courseName', 'requestedSchedule', 'requestedRoom', 'status', 'createdAt']
    });

    const pendingByCourse = new Map();
    pending.forEach((reqDoc) => {
      const key = (reqDoc.courseName || '').trim();
      if (key) pendingByCourse.set(key, reqDoc);
    });

    const result = courses
      .map((course) => {
        const courseName = trimIfString(course.courseName);
        if (!courseName) return null;
        const pendingReq = pendingByCourse.get(courseName);
        return {
          courseName,
          schedule: trimIfString(course.schedule),
          room: trimIfString(course.room),
          hasPendingChange: !!pendingReq,
          pendingRequestId: pendingReq?.id || null,
          requestedSchedule: pendingReq?.requestedSchedule || '',
          requestedRoom: pendingReq?.requestedRoom || '',
          status: pendingReq?.status || null,
        };
      })
      .filter(Boolean);

    return res.json({ courses: result });
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

const requestScheduleChange = async (req, res) => {
  try {
    const rawCourseName = trimIfString(req.body?.courseName);
    const requestedSchedule = trimIfString(req.body?.requestedSchedule);
    const requestedRoom = trimIfString(req.body?.requestedRoom);

    if (!rawCourseName) {
      return res.status(400).json({ error: 'courseName is required' });
    }
    if (!requestedSchedule && !requestedRoom) {
      return res.status(400).json({ error: 'Provide at least a new schedule or room' });
    }

    const user = await User.findByPk(req.user.id, { attributes: ['comCourses'] });
    const courses = Array.isArray(user.comCourses) ? user.comCourses : [];
    const current = courses.find((c) => c.courseName === rawCourseName);

    if (!current) {
      return res.status(400).json({ error: 'You are not enrolled in this subject' });
    }

    const currentSchedule = trimIfString(current.schedule);
    const currentRoom = trimIfString(current.room);
    const storedCourseName = trimIfString(current.courseName) || rawCourseName;

    const existing = await ScheduleChangeRequest.findOne({
      where: { userId: req.user.id, courseName: storedCourseName, status: 'pending' }
    });

    let doc;
    if (existing) {
      existing.requestedSchedule = requestedSchedule || currentSchedule;
      existing.requestedRoom = requestedRoom || currentRoom;
      doc = await existing.save();
    } else {
      doc = await ScheduleChangeRequest.create({
        userId: req.user.id,
        courseName: storedCourseName,
        currentSchedule,
        currentRoom,
        requestedSchedule: requestedSchedule || currentSchedule,
        requestedRoom: requestedRoom || currentRoom,
      });
    }

    return res.status(201).json({
      message: 'Schedule change request submitted',
      request: {
        id: doc.id,
        courseName: doc.courseName,
        currentSchedule: doc.currentSchedule,
        currentRoom: doc.currentRoom,
        requestedSchedule: doc.requestedSchedule,
        requestedRoom: doc.requestedRoom,
        status: doc.status,
        createdAt: doc.createdAt,
      }
    });
  } catch (error) {
    console.error('Schedule change request error:', error);
    return res.status(500).json({ error: 'Failed to submit schedule change request' });
  }
};

const submitReport = async (req, res) => {
  try {
    const subject = trimIfString(req.body?.subject);
    const category = trimIfString(req.body?.category);
    const description = trimIfString(req.body?.description);

    if (!subject || !category || !description) {
      return res.status(400).json({ error: 'Subject, category, and description are required' });
    }
    if (description.length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }

    const report = await Report.create({
      userId: req.user.id,
      subject,
      category,
      description,
    });

    return res.status(201).json({
      message: 'Report submitted',
      report: {
        id: report.id,
        subject: report.subject,
        category: report.category,
        description: report.description,
        status: report.status,
        severity: report.severity,
        createdAt: report.createdAt,
      }
    });
  } catch (error) {
    console.error('Submit report error:', error);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      reports: reports.map((report) => ({
        id: report.id,
        subject: report.subject,
        category: report.category,
        description: report.description,
        status: report.status,
        severity: report.severity,
        createdAt: report.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  recordAttendance,
  getAttendance,
  submitReport,
  getReports,
  getCourses,
  requestScheduleChange,
};
