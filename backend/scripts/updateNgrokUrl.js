#!/usr/bin/env node
/**
 * Fetches your current ngrok URL and updates .env with it.
 * Run this AFTER starting ngrok (ngrok http 3001).
 *
 * Usage: node scripts/updateNgrokUrl.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ngrokApi = 'http://127.0.0.1:4040';
const envPath = path.resolve(__dirname, '../.env');
const frontendEnvPath = path.resolve(__dirname, '../../frontend/.env.local');

function fetchNgrokUrl() {
  return new Promise((resolve, reject) => {
    http.get(`${ngrokApi}/api/tunnels`, (res) => {
      let data = '';
      res.on('data', (ch) => (data += ch));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const tunnel = (json.tunnels || []).find((t) => t.public_url.startsWith('https://'));
          resolve(tunnel ? tunnel.public_url : null);
        } catch {
          reject(new Error('Failed to parse ngrok response'));
        }
      });
    }).on('error', reject);
  });
}

function updateEnv(ngrokUrl) {
  let content = fs.readFileSync(envPath, 'utf8');
  if (content.match(/^FRONTEND_URL=/m)) {
    content = content.replace(/^FRONTEND_URL=.*$/m, `FRONTEND_URL=${ngrokUrl}`);
  } else {
    content = content.trimEnd() + `\nFRONTEND_URL=${ngrokUrl}\n`;
  }
  fs.writeFileSync(envPath, content);

  let frontendContent = '';
  if (fs.existsSync(frontendEnvPath)) {
    frontendContent = fs.readFileSync(frontendEnvPath, 'utf8');
  }
  if (frontendContent.match(/^VITE_FRONTEND_URL=/m)) {
    frontendContent = frontendContent.replace(/^VITE_FRONTEND_URL=.*$/m, `VITE_FRONTEND_URL=${ngrokUrl}`);
  } else {
    frontendContent = (frontendContent.trimEnd() ? `${frontendContent.trimEnd()}\n` : '') + `VITE_FRONTEND_URL=${ngrokUrl}\n`;
  }
  fs.writeFileSync(frontendEnvPath, frontendContent);
}

fetchNgrokUrl()
  .then((url) => {
    if (!url) {
      console.error('No HTTPS tunnel found. Make sure ngrok is running: ngrok http 3001');
      process.exit(1);
    }
    updateEnv(url);
    console.log('Updated .env with:');
    console.log('  FRONTEND_URL=' + url);
    console.log('Updated frontend/.env.local with:');
    console.log('  VITE_FRONTEND_URL=' + url);
    console.log('\nRestart your backend for changes to take effect.');
    console.log('Restart your frontend dev server so it picks up the new VITE_FRONTEND_URL.');
    console.log('Invite links will now work on any network.');
  })
  .catch((err) => {
    console.error('Could not reach ngrok. Is it running?');
    console.error('Start it with: ngrok http 3001');
    console.error(err.message);
    process.exit(1);
  });
