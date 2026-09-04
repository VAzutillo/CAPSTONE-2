/**
 * Authenticates IoT/fingerprint device requests via X-API-Key header.
 * Set IOT_API_KEY in .env. If not set, requests are rejected.
 */
const iotApiKey = process.env.IOT_API_KEY;

const iotAuth = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!iotApiKey) {
    return res.status(503).json({
      error: 'IoT attendance API is not configured. Set IOT_API_KEY in the server environment.',
    });
  }
  if (!key || key !== iotApiKey) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
};

module.exports = { iotAuth };
