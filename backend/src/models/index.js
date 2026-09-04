const { sequelize, Sequelize } = require('../config/db');
const crypto = require('crypto');

const User = sequelize.define('User', {
  name: { type: Sequelize.STRING, defaultValue: '' },
  idNumber: { type: Sequelize.STRING, unique: true, defaultValue: '' },
  block: { type: Sequelize.STRING, defaultValue: '' },
  comCourse: { type: Sequelize.STRING, defaultValue: '' },
  comSchedule: { type: Sequelize.STRING, defaultValue: '' },
  comRoom: { type: Sequelize.STRING, defaultValue: '' },
  comCourses: { type: Sequelize.JSON, defaultValue: [] },
  email: { type: Sequelize.STRING, unique: true, allowNull: false },
  password: { type: Sequelize.STRING, allowNull: false },
  roles: { type: Sequelize.JSON, defaultValue: ['student'] },
  fingerprint: { type: Sequelize.STRING, defaultValue: '' },
  webauthnCredentialId: { type: Sequelize.STRING, defaultValue: '' },
  webauthnPublicKey: { type: Sequelize.STRING, defaultValue: '' },
  fingerprintTemplateId: { type: Sequelize.STRING, defaultValue: '' },
  handledBlocks: { type: Sequelize.JSON, defaultValue: [] }
}, { timestamps: true, tableName: 'users' });

const Attendance = sequelize.define('Attendance', {
  date: { type: Sequelize.DATE, allowNull: false },
  status: { type: Sequelize.ENUM('Present', 'Late', 'Absent'), allowNull: false },
  time: { type: Sequelize.STRING, defaultValue: '-' },
  note: { type: Sequelize.STRING, defaultValue: '' }
}, {
  timestamps: true,
  tableName: 'attendance',
  indexes: [{ fields: ['userId', 'date'], unique: true }]
});

const AuditLog = sequelize.define('AuditLog', {
  action: { type: Sequelize.STRING, allowNull: false },
  user: { type: Sequelize.STRING, allowNull: false },
  details: { type: Sequelize.STRING, defaultValue: '' },
  status: { type: Sequelize.ENUM('Success', 'Failed', 'Warning'), defaultValue: 'Success' },
  ip: { type: Sequelize.STRING, defaultValue: '' }
}, { timestamps: true, tableName: 'audit_logs' });

const Report = sequelize.define('Report', {
  subject: { type: Sequelize.STRING, allowNull: false },
  category: { type: Sequelize.STRING, allowNull: false },
  description: { type: Sequelize.STRING, allowNull: false },
  status: { type: Sequelize.STRING, defaultValue: 'open' },
  severity: { type: Sequelize.STRING, defaultValue: 'medium' }
}, { timestamps: true, tableName: 'reports' });

const ScheduleChangeRequest = sequelize.define('ScheduleChangeRequest', {
  courseName: { type: Sequelize.STRING, defaultValue: '' },
  currentSchedule: { type: Sequelize.STRING, defaultValue: '' },
  currentRoom: { type: Sequelize.STRING, defaultValue: '' },
  requestedSchedule: { type: Sequelize.STRING, defaultValue: '' },
  requestedRoom: { type: Sequelize.STRING, defaultValue: '' },
  status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  adminNote: { type: Sequelize.STRING, defaultValue: '' }
}, { timestamps: true, tableName: 'schedule_change_requests' });

const MasterScheduleEntry = sequelize.define('MasterScheduleEntry', {
  block: { type: Sequelize.STRING, allowNull: false },
  courseName: { type: Sequelize.STRING, allowNull: false },
  schedule: { type: Sequelize.STRING, defaultValue: '' },
  room: { type: Sequelize.STRING, defaultValue: '' },
  assignedProfessorEmail: { type: Sequelize.STRING, defaultValue: '' },
  graceOverrideMinutes: { type: Sequelize.INTEGER, defaultValue: 0 },
  order: { type: Sequelize.INTEGER }
}, { timestamps: true, tableName: 'master_schedule_entries' });

const InviteToken = sequelize.define('InviteToken', {
  token: { type: Sequelize.STRING, unique: true, allowNull: false },
  email: { type: Sequelize.STRING, defaultValue: null },
  role: { type: Sequelize.ENUM('student'), defaultValue: 'student' },
  expiresAt: { type: Sequelize.DATE, allowNull: false },
  used: { type: Sequelize.BOOLEAN, defaultValue: false },
  usedCount: { type: Sequelize.INTEGER, defaultValue: 0 },
  maxUses: { type: Sequelize.INTEGER, defaultValue: 50 },
  usedAt: { type: Sequelize.DATE }
}, { timestamps: true, tableName: 'invite_tokens' });

const SystemSettings = sequelize.define('SystemSettings', {
  key: { type: Sequelize.STRING, unique: true, allowNull: false },
  value: { type: Sequelize.JSON, allowNull: false }
}, { timestamps: true, tableName: 'system_settings' });

const ArchiveRequest = sequelize.define('ArchiveRequest', {
  studentName: { type: Sequelize.STRING, allowNull: false },
  studentBlock: { type: Sequelize.STRING, defaultValue: '' },
  reason: { type: Sequelize.TEXT, defaultValue: '' },
  status: { type: Sequelize.ENUM('Pending', 'Reviewed', 'Approved', 'Rejected'), defaultValue: 'Pending' }
}, { timestamps: true, tableName: 'archive_requests' });

User.hasMany(Attendance, { foreignKey: 'userId', onDelete: 'CASCADE' });
Attendance.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Report, { foreignKey: 'userId', onDelete: 'CASCADE' });
Report.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ScheduleChangeRequest, { foreignKey: 'userId', onDelete: 'CASCADE' });
ScheduleChangeRequest.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(AuditLog, { foreignKey: 'userId', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

InviteToken.belongsTo(User, { foreignKey: 'createdById', onDelete: 'SET NULL' });
ArchiveRequest.belongsTo(User, { foreignKey: 'requestedById', onDelete: 'SET NULL' });

InviteToken.createInvite = async function(opts = {}) {
  const { email, createdById, expiresInDays = 7, maxUses = 50 } = opts;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const doc = await this.create({
    token,
    email: email || null,
    role: 'student',
    expiresAt,
    maxUses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : 50,
    createdById
  });

  return { token: doc.token, expiresAt: doc.expiresAt };
};

module.exports = {
  sequelize,
  Sequelize,
  User,
  Attendance,
  AuditLog,
  Report,
  ScheduleChangeRequest,
  MasterScheduleEntry,
  InviteToken,
  SystemSettings,
  ArchiveRequest
};
