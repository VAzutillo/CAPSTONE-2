# ngrok Setup for Invite Links (No Deployment)

Use ngrok to share the student registration invite link from your local machine without deploying.

## Prerequisites

- [ngrok](https://ngrok.com/) installed ([download](https://ngrok.com/download))
- Frontend and backend running locally

## Quick Start

### 1. Start your app

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 2. Start ngrok (expose frontend only)

```bash
# Terminal 3
ngrok http 3001
```

ngrok will show a public URL like:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3001
```

### 3. Update backend .env (automatic)

With ngrok running, from the `backend` folder run:

```bash
npm run update-ngrok
```

This fetches your ngrok URL and updates `.env` for you. Then **restart the backend**.

### 4. Use the invite link

1. Log in as Admin or Super Admin
2. Go to **Invite Students**
3. Create invite → the link will use your ngrok URL
4. Share the link; students can open it on any device (phone, tablet, another computer)

## How it works

- **One tunnel:** ngrok exposes your frontend (port 3001). Vite’s dev proxy forwards `/api` requests to your backend, so only one ngrok tunnel is needed.
- **CORS:** The backend allows ngrok origins (any `*.ngrok-free.app` or `*.ngrok.io`).
- **Invite links:** `FRONTEND_URL` is used to build links like `https://abc123.ngrok-free.app/register/student?token=...`.

## Notes

- **Free ngrok:** The URL changes each time you restart ngrok. Update `FRONTEND_URL` in `.env` and restart the backend.
- **ngrok free tier:** You may need to click “Visit Site” on the first load when ngrok shows an interstitial page.
- **IoT device:** If your fingerprint device calls the backend from another network, run a second ngrok tunnel for the backend (`ngrok http 5000`) and use that URL in the device config.
