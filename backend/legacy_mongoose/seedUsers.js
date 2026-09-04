/**
 * Legacy MongoDB seed (archived). Original file moved here for safekeeping.
 * This project now uses MySQL/Sequelize. Use `node scripts/seedUsersSql.js` instead.
 * If you still need to run the MongoDB seed, ensure `mongoose` is installed and the
 * MONGODB_URI environment variable points to your MongoDB instance, then run this file directly.
 */
// Archived original contents:
/*
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/capstone';
const DEFAULT_PASSWORD = 'password123';

const users = [
  {
    email: 'student@test.com',
    password: DEFAULT_PASSWORD,
    roles: ['student'],
    name: 'Test Student',
    block: 'Block A',
    comCourses: [
      { courseName: 'COM 101', schedule: 'MWF 8:00-9:00', room: 'Room 101' },
    ],
  },
  {
    email: 'admin@test.com',
    password: DEFAULT_PASSWORD,
    roles: ['admin'],
    name: '',
    block: '',
    comCourses: [],
  },
  {
    email: 'superadmin@test.com',
    password: DEFAULT_PASSWORD,
    roles: ['super_admin'],
    name: '',
    block: '',
    comCourses: [],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`User ${u.email} already exists, skipping`);
        continue;
      }
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await User.create({
        email: u.email,
        password: hashedPassword,
        roles: u.roles,
        name: u.name || '',
        block: u.block || '',
        comCourse: u.comCourses[0]?.courseName || '',
        comSchedule: u.comCourses[0]?.schedule || '',
        comRoom: u.comCourses[0]?.room || '',
        comCourses: u.comCourses || [],
      });
      console.log(`Created: ${u.email} (${u.roles[0]})`);
    }

    console.log('\nSeed complete. You can login with:');
    console.log('  Student:     student@test.com / password123');
    console.log('  Admin:       admin@test.com / password123');
    console.log('  Super Admin: superadmin@test.com / password123');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  }
}

seed();
*/

console.log('This is an archived MongoDB seed. Use node scripts/seedUsersSql.js (MySQL) instead.');
