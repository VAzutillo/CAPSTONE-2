
 # CITE Admin Panel

 A modern admin dashboard for CITE attendance monitoring with a minimalist login/forgot-password flow and responsive layout.

 ## Features
 - Admin login and forgot-password screens
 - Dashboard overview with charts and alerts
 - Reports table with CSV export
 - User management, settings, and audit logs sections
 - Responsive sidebar and layout

 ## Tech Stack
 - React + TypeScript (Vite)
 - Tailwind CSS + shadcn/ui components
 - Recharts for data visualizations
 - Lucide icons

## Getting Started (Frontend)
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```

## Scripts (Frontend)
- `npm run dev` - start development server
- `npm run build` - build for production
- `npm run preview` - preview the production build

## Backend Setup (MERN)
1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file:
   ```bash
   copy .env.example .env
   ```
3. Update `MONGODB_URI` in `.env` with your database connection string.
4. Start the backend server:
   ```bash
   npm run dev
   ```
5. Verify it is running:
   - `GET http://localhost:5000/api/health` should return `{ "status": "ok" }`.

## MongoDB Setup
### Local MongoDB
1. Install MongoDB Community Server.
2. Ensure the MongoDB service is running.
3. Use this connection string in `.env`:
   - `MONGODB_URI=mongodb://127.0.0.1:27017/capstone`

### MongoDB Atlas
1. Create a new cluster in MongoDB Atlas.
2. Create a database user and password.
3. Allow your IP address in Network Access.
4. Copy the SRV connection string and set it in `.env`:
   - `MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<dbName>?retryWrites=true&w=majority`

## Invite Link Registration
- Admins and teachers generate invite links from **Invite Students** in the dashboard.
- Copy the link and send it to the student (e.g., via email).
- Student clicks the link → opens registration form in browser → creates account.
- Each invite link expires in 7 days (configurable) and can be used once.

## IoT / Fingerprint Attendance
- Fingerprint scanners can record attendance by calling:
  - `POST /api/iot/attendance` with `X-API-Key` header (set `IOT_API_KEY` in `.env`)
  - Body: `{ "userId": "..." }` or `{ "email": "student@phinmaed.edu.ph" }` and optional `"status": "Present"|"Late"`, `"deviceId"`
- The IoT device should identify the student (e.g., from fingerprint match) and send the request to record check-in.

## Notes
- Set `FRONTEND_URL` in `.env` for invite links (default: `http://localhost:3001`).
- Set `IOT_API_KEY` in `.env` for IoT attendance API access.
