const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  updatePassword,
  recordAttendance,
  getAttendance,
  submitReport,
  getReports,
  getCourses,
  requestScheduleChange,
} = require('../controllers/studentController');

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);
router.get('/attendance', authenticate, getAttendance);
router.post('/attendance', authenticate, recordAttendance);
router.post('/reports', authenticate, submitReport);
router.get('/reports', authenticate, getReports);
router.get('/courses', authenticate, getCourses);
router.post('/schedule-change-requests', authenticate, requestScheduleChange);

module.exports = router;
