/**
 * Sequelize seed script: creates student, admin, and super_admin accounts for login testing.
 * Run from project root: node backend/scripts/seedUsersSql.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../src/models');

const DEFAULT_PASSWORD = 'password123';

const users = [
  { email: 'student@test.com', password: DEFAULT_PASSWORD, roles: ['student'], name: 'Test Student', block: 'Block A' },
  { email: 'admin@test.com', password: DEFAULT_PASSWORD, roles: ['admin'], name: 'Admin User', block: '' },
  { email: 'superadmin@test.com', password: DEFAULT_PASSWORD, roles: ['super_admin'], name: 'Super Admin', block: '' },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected');

    for (const u of users) {
        const [instance, created] = await User.findOrCreate({
          where: { email: u.email },
          defaults: {
            name: u.name || '',
            email: u.email,
            idNumber: u.idNumber || u.email,
            password: await bcrypt.hash(u.password, 10),
            roles: u.roles,
            block: u.block || ''
          }
        });
      if (!created) {
        console.log(`User ${u.email} already exists, skipping`);
      } else {
        console.log(`Created: ${u.email} (${u.roles[0]})`);
      }
    }

    console.log('\nSeed complete. You can login with:');
    console.log('  Student:     student@test.com / password123');
    console.log('  Admin:       admin@test.com / password123');
    console.log('  Super Admin: superadmin@test.com / password123');
  } catch (err) {
    console.error('Seed error:', err.message || err);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('MySQL connection closed');
    process.exit(0);
  }
}

seed();
