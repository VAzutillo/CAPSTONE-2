const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const { connectDB, sequelize } = require('./config/db');
const { applySecurity, apiRateLimiter, noSqlSanitize } = require('./middleware/security');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin-api');
// const iotRoutes = require('./routes/iot');
const notificationRoutes = require('./routes/notifications-api');
const publicRoutes = require('./routes/public');

const app = express();

/* Security: Helmet, NoSQL injection protection */
applySecurity(app);

/* CORS — VERY IMPORTANT */
const corsOrigins = [
  'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173',
  'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:5173',
  'http://10.33.168.54:3000'
];
if (process.env.FRONTEND_URL && !corsOrigins.includes(process.env.FRONTEND_URL)) {
  corsOrigins.push(process.env.FRONTEND_URL);
}
const ngrokOrigin = (origin, cb) => {
  if (!origin) return cb(null, true);
  if (corsOrigins.includes(origin)) return cb(null, true);
  if (/^https?:\/\/[a-z0-9-]+\.ngrok(-free)?\.(app|io|dev)(:\d+)?$/i.test(origin)) return cb(null, true);
  return cb(null, false);
};
app.use(cors({
  origin: (origin, callback) => ngrokOrigin(origin, callback),
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization','X-API-Key']
}));

app.use(express.json());
app.use(cookieParser());

/* NoSQL injection protection - strips $ and . from user input */
app.use(noSqlSanitize);

/* Rate limiting - apply to API routes */
app.use('/api', apiRateLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/iot', iotRoutes);
app.use('/api/notifications', notificationRoutes);

/* Return JSON for missing API routes so the frontend does not try to parse HTML */
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

/* Ensure all errors return JSON (prevents "invalid response" on frontend) */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await sequelize.sync({ alter: false });
    console.log('Invite links will use:', process.env.FRONTEND_URL || 'http://localhost:3001');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
