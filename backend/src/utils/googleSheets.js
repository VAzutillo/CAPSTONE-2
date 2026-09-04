const https = require('https');
const http = require('http');
const { URL } = require('url');

const postJson = (targetUrl, data, timeoutMs = 12000) => new Promise((resolve, reject) => {
  const url = new URL(targetUrl);
  const payload = JSON.stringify(data);
  const transport = url.protocol === 'https:' ? https : http;

  const req = transport.request(
    {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: `${url.pathname}${url.search}`,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode || 0, body });
      });
    }
  );

  req.on('error', reject);
  req.setTimeout(timeoutMs, () => {
    req.destroy(new Error('Google Sheets request timed out'));
  });
  req.write(payload);
  req.end();
});

const sendRegistrationToGoogleSheets = async (payload) => {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL || '';
  if (!url) return { skipped: true };
  return postJson(url, payload);
};

module.exports = { sendRegistrationToGoogleSheets };
