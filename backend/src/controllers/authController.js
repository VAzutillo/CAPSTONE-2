const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, InviteToken, AuditLog, SystemSettings, Sequelize } = require('../models');
const { validatePassword } = require('../utils/passwordPolicy');
const { sendRegistrationToGoogleSheets } = require('../utils/googleSheets');
const { comCoursesFromMasterBlock } = require('./masterScheduleController');

const { Op } = Sequelize;

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const normalizeRole = (roles) => {
  if (!roles || !Array.isArray(roles)) return 'admin';
  if (roles.includes('super_admin')) return 'super_admin';
  if (roles.includes('program_head')) return 'program_head';
  if (roles.includes('student')) return 'student';
  return 'admin';
};

const validateInvite = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ valid: false, error: 'Token required' });

    const invite = await InviteToken.findOne({ where: { token } });
    if (!invite || invite.used) {
      return res.json({ valid: false, error: 'Invalid or expired invite link' });
    }

    const now = new Date();
    if (now > invite.expiresAt) {
      return res.json({ valid: false, error: 'Invite link has expired' });
    }

    const maxUses = typeof invite.maxUses === 'number' && invite.maxUses > 0 ? invite.maxUses : 1;
    const usedCount = typeof invite.usedCount === 'number' ? invite.usedCount : 0;
    if (usedCount >= maxUses) {
      return res.json({ valid: false, error: 'Invite link has reached its maximum number of registrations' });
    }

    return res.json({
      valid: true,
      email: invite.email || null,
    });
  } catch (error) {
    console.error('Validate invite error:', error);
    return res.status(500).json({ valid: false, error: 'Failed to validate invite' });
  }
};

const register = async (req, res) => {
  try {
    const {
      token: inviteToken,
      email,
      password,
      role,
      name,
      firstName,
      lastName,
      middleInitial,
      idNumber,
      block,
      comCourse,
      comSchedule,
      comRoom,
      comCourses,
      fingerprint,
      fingerprintTemplateId,
      webauthnCredentialId,
      webauthnPublicKey,
      semester,
      schoolYear,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      return res.status(400).json({ error: pwdCheck.error });
    }

    const normalizedRole = role || 'student';

    let inviteDoc = null;
    if (normalizedRole === 'student') {
      if (!inviteToken) {
        return res.status(400).json({ error: 'Registration requires a valid invite link from your admin or teacher' });
      }

      inviteDoc = await InviteToken.findOne({ where: { token: inviteToken } });
      if (!inviteDoc || inviteDoc.used) {
        return res.status(400).json({ error: 'Invalid or expired invite link. Please request a new one.' });
      }
      const now = new Date();
      if (now > inviteDoc.expiresAt) {
        return res.status(400).json({ error: 'Invite link has expired. Please request a new one.' });
      }
      if (inviteDoc.email && inviteDoc.email !== email.toLowerCase().trim()) {
        return res.status(400).json({ error: 'This invite link is for a different email address' });
      }

      const maxUses = typeof inviteDoc.maxUses === 'number' && inviteDoc.maxUses > 0 ? inviteDoc.maxUses : 1;
      const usedCount = typeof inviteDoc.usedCount === 'number' ? inviteDoc.usedCount : 0;
      if (usedCount >= maxUses) {
        return res.status(400).json({ error: 'Invite link has reached its maximum number of registrations. Please request a new one.' });
      }
    }

    const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existingUser)
      return res.status(409).json({ error: 'User already exists' });

    const normalizedEmail = email.toLowerCase().trim();

    const normalizedComCourses = Array.isArray(comCourses)
      ? comCourses
          .map((course) => ({
            courseName: typeof course?.courseName === 'string' ? course.courseName.trim() : '',
            schedule: typeof course?.schedule === 'string' ? course.schedule.trim() : '',
            room: typeof course?.room === 'string' ? course.room.trim() : '',
          }))
          .filter((course) => course.courseName || course.schedule || course.room)
      : [];

    const fallbackComCourse =
      typeof comCourse === 'string' ||
      typeof comSchedule === 'string' ||
      typeof comRoom === 'string'
        ? [
            {
              courseName: typeof comCourse === 'string' ? comCourse.trim() : '',
              schedule: typeof comSchedule === 'string' ? comSchedule.trim() : '',
              room: typeof comRoom === 'string' ? comRoom.trim() : '',
            },
          ]
        : [];

    let finalComCourses = normalizedComCourses.length > 0 ? normalizedComCourses : fallbackComCourse;

    if (normalizedRole === 'student') {
      if (!name || !idNumber || !block) {
        return res.status(400).json({ error: 'Name, ID number, and block are required for student registration' });
      }
      const trimmedIdNumber = typeof idNumber === 'string' ? idNumber.trim() : '';
      if (!/^[0-9\-]+$/.test(trimmedIdNumber)) {
        return res.status(400).json({ error: 'ID number must contain only numbers and dashes (e.g. 03-2324-035749)' });
      }

      const blockTrim = typeof block === 'string' ? block.trim() : '';
      if (finalComCourses.length === 0 && blockTrim) {
        const fromMaster = await comCoursesFromMasterBlock(blockTrim);
        if (fromMaster.length > 0) {
          finalComCourses = fromMaster;
        }
      }

      if (finalComCourses.length === 0) {
        return res.status(400).json({
          error:
            'Add your courses on the form, or ask your Program Head to publish a master schedule for your block so your subjects can load automatically.',
        });
      }

      if (finalComCourses.length > 12) {
        return res.status(400).json({ error: 'You can only register up to 12 courses' });
      }

      const hasInvalidCourse = finalComCourses.some(
        (course) => !course.courseName || !course.schedule || !course.room
      );

      if (hasInvalidCourse) {
        return res.status(400).json({
          error: 'Each course must include course name, schedule, and room',
        });
      }

      const allowedEmail =
        normalizedEmail.endsWith('@phinmaed.com') ||
        normalizedEmail.endsWith('@phinmaed.edu.ph');
      if (!allowedEmail) {
        return res.status(400).json({ error: 'Please use your PHINMAED email address (e.g. @phinmaed.com)' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      roles: [normalizedRole],
      name: typeof name === 'string' ? name.trim() : '',
      idNumber: typeof idNumber === 'string' ? idNumber.trim() : '',
      block: typeof block === 'string' ? block.trim() : '',
      comCourse:
        finalComCourses[0]?.courseName || (typeof comCourse === 'string' ? comCourse.trim() : ''),
      comSchedule:
        finalComCourses[0]?.schedule || (typeof comSchedule === 'string' ? comSchedule.trim() : ''),
      comRoom: finalComCourses[0]?.room || (typeof comRoom === 'string' ? comRoom.trim() : ''),
      comCourses: finalComCourses,
      fingerprint: typeof fingerprint === 'string' ? fingerprint.trim() : '',
      fingerprintTemplateId: typeof fingerprintTemplateId === 'string' ? fingerprintTemplateId.trim() : '',
      webauthnCredentialId: typeof webauthnCredentialId === 'string' ? webauthnCredentialId.trim() : '',
      webauthnPublicKey: typeof webauthnPublicKey === 'string' ? webauthnPublicKey.trim() : '',
    });

    let fingerprintId = typeof newUser.fingerprintTemplateId === 'string'
      ? newUser.fingerprintTemplateId.trim()
      : '';
    if (!fingerprintId) {
      if (normalizedRole === 'student') {
        const studentCount = await User.count({
          where: { roles: JSON.stringify(['student']) },
        });
        let candidate = Math.max(1, studentCount);
        while (await User.findOne({ where: { fingerprintTemplateId: String(candidate), id: { [Op.ne]: newUser.id } } })) {
          candidate += 1;
        }
        fingerprintId = String(candidate);
      } else {
        fingerprintId = String(newUser.id);
      }
      await newUser.update({ fingerprintTemplateId: fingerprintId });
    }

    const nameText = typeof name === 'string' ? name.trim() : '';
    let parsedLast = '';
    let parsedFirst = '';
    let parsedMiddle = '';
    if (nameText.includes(',')) {
      const parts = nameText.split(',');
      parsedLast = (parts[0] || '').trim();
      const rest = (parts[1] || '').trim().split(/\s+/);
      parsedFirst = rest[0] || '';
      parsedMiddle = (rest[1] || '').replace('.', '');
    } else if (nameText) {
      const parts = nameText.split(/\s+/);
      parsedFirst = parts.shift() || '';
      parsedLast = parts.join(' ');
    }
    const finalFirstName = typeof firstName === 'string' && firstName.trim() ? firstName.trim() : parsedFirst;
    const finalLastName = typeof lastName === 'string' && lastName.trim() ? lastName.trim() : parsedLast;
    const finalMiddleInitial = typeof middleInitial === 'string' && middleInitial.trim()
      ? middleInitial.trim()
      : parsedMiddle;

    const sheetCoursesPayload = Array.isArray(comCourses)
      ? comCourses
          .map((course) => {
            const courseName = typeof course?.courseName === 'string' ? course.courseName.trim() : '';
            if (!courseName) return null;
            const sepIdx = courseName.indexOf(' - ');
            const subjectId = sepIdx >= 0 ? courseName.slice(0, sepIdx).trim() : courseName.trim();
            return subjectId ? { subjectId } : null;
          })
          .filter(Boolean)
      : [];

    if (normalizedRole === 'student' && process.env.GOOGLE_APPS_SCRIPT_URL) {
      try {
        await sendRegistrationToGoogleSheets({
          mode: 'register',
          student: {
            studentId: typeof idNumber === 'string' ? idNumber.trim() : '',
            lastName: finalLastName,
            firstName: finalFirstName,
            middleInitial: finalMiddleInitial,
            block: typeof block === 'string' ? block.trim() : '',
            status: 'Active',
            fingerprintId,
          },
          courses: sheetCoursesPayload,
        });
      } catch (sheetErr) {
        console.error('Google Sheets sync failed:', sheetErr.message || sheetErr);
      }
    }

    if (normalizedRole === 'student' && inviteDoc) {
      const maxUses = typeof inviteDoc.maxUses === 'number' && inviteDoc.maxUses > 0 ? inviteDoc.maxUses : 1;
      const previousCount = typeof inviteDoc.usedCount === 'number' ? inviteDoc.usedCount : 0;
      const newCount = previousCount + 1;

      const update = {
        usedCount: newCount,
      };
      if (newCount >= maxUses) {
        update.used = true;
        update.usedAt = new Date();
      }

      await InviteToken.update(update, { where: { id: inviteDoc.id } });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: { email: newUser.email, role: newUser.roles[0] },
      fingerprintId
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      try {
        await AuditLog.create({
          action: 'User Login',
          user: email,
          details: 'Failed login - user not found',
          status: 'Failed',
          ip: req.ip || req.socket?.remoteAddress || '',
        });
      } catch (e) { /* ignore */ }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      try {
        await AuditLog.create({
          action: 'User Login',
          user: user.email,
          details: 'Failed login - invalid password',
          status: 'Failed',
          ip: req.ip || req.socket?.remoteAddress || '',
        });
      } catch (e) { /* ignore */ }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const role = normalizeRole(user.roles);

    if (expectedRole && role !== expectedRole) {
      return res.status(403).json({
        error: `Access denied. This login page is for ${expectedRole} only.`
      });
    }

    try {
      const maint = await SystemSettings.findOne({ where: { key: 'maintenanceMode' } });
      if (maint && maint.value && role !== 'super_admin') {
        return res.status(503).json({ error: 'System is under maintenance. Only super admins can access.' });
      }
    } catch (e) { /* ignore */ }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    try {
      await AuditLog.create({
        action: 'User Login',
        user: user.email,
        details: 'Successful login',
        status: 'Success',
        ip: req.ip || req.socket?.remoteAddress || '',
      });
    } catch (e) { /* ignore */ }

    res.json({
      message: 'Login successful',
      user: { email: user.email, role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Invalid credentials' });
  }
};

const me = async (req, res) => {
  try {
    const role = normalizeRole(req.user.roles);
    const payload = { user: { email: req.user.email, role } };
    if (role === 'admin' || role === 'super_admin' || role === 'program_head') {
      payload.user.name = req.user.name || '';
      payload.user.handledBlocks = Array.isArray(req.user.handledBlocks)
        ? req.user.handledBlocks.filter((b) => typeof b === 'string' && b.trim())
        : [];
    }
    res.json(payload);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  });
  res.json({ message: 'Logged out successfully' });
};

module.exports = { register, login, me, logout, validateInvite };
