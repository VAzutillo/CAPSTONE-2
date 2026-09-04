/**
 * Legacy MongoDB attendance seed (archived). Use MySQL/Sequelize seeds instead.
 * Archived original script.
 */
/*
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Attendance = require('../src/models/Attendance');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/capstone';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    const student = await User.findOne({ roles: 'student' }).select('_id');
    if (!student) {
      console.log('No student user found. Run seedUsers.js first.');
      process.exit(1);
    }

    const statuses = ['Present', 'Present', 'Present', 'Late', 'Present'];
    for (let d = 0; d < 7; d++) {
      const day = new Date();
      day.setDate(day.getDate() - d);
      day.setHours(0, 0, 0, 0);

      const existing = await Attendance.findOne({ user: student._id, date: day });
      if (existing) {
        console.log(`Attendance exists for ${day.toISOString().slice(0, 10)}, skip`);
        continue;
      }

      const status = statuses[d % statuses.length];
      await Attendance.create({
        user: student._id,
        date: day,
        status,
        time: '08:00',
        note: 'Seeded for demo',
      });
      console.log(`Created: ${day.toISOString().slice(0, 10)} ${status}`);
    }

    console.log('\nDone. Refresh Admin Overview to see Attendance Trends.');
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

console.log('This is an archived MongoDB attendance seed. Use MySQL/Sequelize seeds if available.');
