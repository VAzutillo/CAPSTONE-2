const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connected Successfully via Sequelize');
  } catch (error) {
    console.error('Sequelize Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB, Sequelize };

