const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Authentication error' });
  }
};

const requireRole = (allowedRoles = ['admin', 'super_admin']) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const hasRole = allowedRoles.some((r) => user.roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: 'Access denied. Admin or Super Admin only.' });
    }
    next();
  };
};

const requireSuperAdmin = (req, res, next) => {
  const user = req.user;
  if (!user || !user.roles || !user.roles.includes('super_admin')) {
    return res.status(403).json({ error: 'Access denied. Super Admin only.' });
  }
  next();
};

const requireProgramHeadOrSuper = (req, res, next) => {
  const user = req.user;
  if (!user?.roles) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const hasRole = user.roles.includes('program_head') || user.roles.includes('super_admin');
  if (!hasRole) {
    return res.status(403).json({ error: 'Access denied. Program Head or Super Admin only.' });
  }
  next();
};

module.exports = { authenticate, requireRole, requireSuperAdmin, requireProgramHeadOrSuper };
