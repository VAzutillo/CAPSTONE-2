const express = require('express');
const router = express.Router();
const { iotAuth } = require('../middleware/iotAuth');
const { recordAttendance, matchFingerprint } = require('../controllers/iotController');

router.post('/attendance', iotAuth, recordAttendance);
router.post('/fingerprint/match', iotAuth, matchFingerprint);

module.exports = router;
