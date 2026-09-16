// lib/cors-helper.js
// Shared CORS utility — restricts API access to known trusted origins only.

const ALLOWED_ORIGINS = [
  'https://job-openings-one.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://localhost:3000',
];

/**
 * Sets CORS response headers for a given request.
 * Only allows requests from explicitly whitelisted origins.
 *
 * @param {object} req - Incoming HTTP request
 * @param {object} res - Outgoing HTTP response
 * @param {object} options
 * @param {string} [options.methods='GET, POST, OPTIONS'] - Allowed HTTP methods
 * @param {string} [options.headers='Content-Type'] - Allowed request headers
 */
export function setCorsHeaders(req, res, { methods = 'GET, POST, OPTIONS', headers = 'Content-Type' } = {}) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
}
