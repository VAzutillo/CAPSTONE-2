const express = require('express');
const router = express.Router();

const { authRateLimiter } = require('../middleware/security');
const { login, me, logout, register, validateInvite } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

/* Rate limit login/register to prevent brute force */
router.post('/login', authRateLimiter, login);
router.post('/register', authRateLimiter, register);

router.get('/invite/:token', validateInvite);
router.get('/me', authenticate, me);
router.post('/logout', logout);

module.exports = router;
