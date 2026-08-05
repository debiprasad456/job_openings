import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import dns from 'dns';

// Force use of IPv4 DNS servers to bypass ISP (e.g., Reliance Jio) IPv6 SRV resolution bugs
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Parse .env manually to load MONGODB_URI and JWT_SECRET
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        let val = trimmed.substring(index + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
    console.log('Successfully loaded environment variables from .env');
  } else {
    console.warn('.env file not found');
  }
} catch (e) {
  console.error('Error loading .env file:', e);
}

const ALLOWED_ORIGINS = [
  'https://job-openings-one.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
];

const server = http.createServer(async (req, res) => {
  // CORS Headers — restrict to known origins
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  req.query = parsedUrl.query;

  // Map URL pathname to local file inside api/
  const relativePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  let filePath = path.join(process.cwd(), relativePath + '.js');

  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), relativePath, 'index.js');
  }

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: `Not found: ${pathname}` }));
    return;
  }

  const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10 MB limit
  let bodyText = '';
  req.on('data', chunk => {
    if (bodyText.length + chunk.length > MAX_BODY_SIZE) {
      req.destroy();
      res.statusCode = 413;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Request body too large.' }));
      return;
    }
    bodyText += chunk;
  });

  req.on('end', async () => {
    try {
      if (bodyText) {
        try {
          req.body = JSON.parse(bodyText);
        } catch (e) {
          req.body = bodyText;
        }
      } else {
        req.body = {};
      }

      // Add Vercel response helper methods
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };

      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return res;
      };

      res.send = (data) => {
        res.end(data);
        return res;
      };

      // Dynamically import handler
      const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
      console.log(`[HTTP] ${req.method} ${pathname} -> Routing to ${filePath}`);
      const { default: handler } = await import(`${fileUrl}?t=${Date.now()}`);

      await handler(req, res);
    } catch (err) {
      console.error(`Error in handler for ${pathname}:`, err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal server error.' }));
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Local Backend Server running at http://localhost:${PORT}\n`);
});
