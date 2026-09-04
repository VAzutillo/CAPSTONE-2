const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { getNotificationSummary } = require('../controllers/notificationController');

router.use(authenticate);

router.get('/', getNotificationSummary);

module.exports = router;

