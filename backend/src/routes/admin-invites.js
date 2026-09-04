const express = require('express');
const router = express.Router();

const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { InviteToken } = require('../models');

router.use(authenticate);
router.use(requireSuperAdmin);

router.post('/invites', async (req, res) => {
  try {
    const { email, expiresInDays = 7 } = req.body;
    const tokenResult = await InviteToken.createInvite({
      email: typeof email === 'string' && email.trim() ? email.trim() : null,
      createdById: req.user?.id,
      expiresInDays: Math.min(Math.max(Number(expiresInDays) || 7, 1), 30),
      maxUses: 50,
    });

    const frontendUrl = (typeof req.get === 'function' && req.get('origin')) || process.env.FRONTEND_URL || 'http://localhost:3001';
    const inviteLink = `${frontendUrl}/register/student?token=${tokenResult.token}`;

    return res.status(201).json({
      message: 'Invite link created',
      inviteLink,
      token: tokenResult.token,
      expiresAt: tokenResult.expiresAt,
    });
  } catch (error) {
    console.error('Create invite error:', error);
    return res.status(500).json({ error: 'Failed to create invite link' });
  }
});

module.exports = router;