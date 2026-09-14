// workers/api-sensors.js
import http from 'http';
import url from 'url';
import fs from 'fs/promises';
import path from 'path';

const PORT = process.env.WORKER_API_SENSORS_PORT || 3001; // Choose an appropriate port
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(process.cwd(), 'public', 'downloads');

// Simple multipart/form-data parser for the specific use case
async function parseMultipartFormData(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return reject(new Error('Invalid content type'));
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return reject(new Error('Boundary not found'));
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const boundaryBuffer = Buffer.from(`--${boundary}`);
      const parts = [];
      
      let start = buffer.indexOf(boundaryBuffer);
      while (start !== -1) {
        const end = buffer.indexOf(boundaryBuffer, start + boundaryBuffer.length);
        if (end === -1) break;
        
        parts.push(buffer.slice(start + boundaryBuffer.length + 2, end - 2)); // +2 for \r\n, -2 for \r\n
        start = end;
      }

      const formData = new Map();
      const fileData = { buffer: null, filename: null };

      parts.forEach(part => {
        if (part.length === 0 || part.toString().trim() === '--') return;
        
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) return;

        const headerStr = part.slice(0, headerEnd).toString();
        const body = part.slice(headerEnd + 4);

        if (headerStr.includes('name="serial"')) {
           formData.set('serial', body.toString().trim());
        } else if (headerStr.includes('name="file"')) {
           const filenameMatch = headerStr.match(/filename="([^"]+)"/);
           if (filenameMatch) {
             fileData.filename = filenameMatch[1];
             fileData.buffer = body;
           }
        }
      });

      resolve({ formData, fileData });
    });
    req.on('error', reject);
  });
}


const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Simple logging function as we are moving away from nextjs logger
  const logSensorRequest = (pathname, serial, filename) => {
    const now = new Date().toISOString();
    console.log(`[${now}] ${req.method} ${pathname} serial=${serial} filename=${filename}`);
  }

  // --- /api/sensors/config logic ---
  if (req.method === 'GET' && pathname === '/api/sensors/config') {
    const serial = parsedUrl.query.serial;
    const filename = serial ? `SPK3-${serial.replace(/^SPK3-/i, '')}_cfg.json` : null;

    logSensorRequest(pathname, serial, filename);

    if (!serial) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Serial parameter is required' }));
      return;
    }

    try {
      const filePath = path.join(DOWNLOAD_DIR, filename);
      const fileContentStr = await fs.readFile(filePath, 'utf-8');
      const fileContent = JSON.parse(fileContentStr);
      fileContent.timestamp = Math.floor(Date.now() / 1000);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fileContent));
    } catch (error) {
       // Even if config is not found, return the timestamp
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify({ timestamp: Math.floor(Date.now() / 1000), TZ: 3 }));
    }
    return;
  }

  // --- /api/sensors/publish logic ---
  if (req.method === 'POST' && pathname === '/api/sensors/publish') {
    try {
      const { formData, fileData } = await parseMultipartFormData(req);
      const serial = formData.get('serial') || 'unknown';
      const file = fileData.buffer ? fileData : null;
      const filename = file ? (file.filename || `file_${Date.now()}.txt`) : null;

      logSensorRequest(pathname, serial, filename);

      if (!file) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No file uploaded' }));
        return;
      }

      try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
      } catch (err) {
        // Ignore if exists
      }

      const filePath = path.join(UPLOAD_DIR, filename);
      await fs.writeFile(filePath, file.buffer);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `File ${filename} saved` }));
    } catch (error) {
      console.error('Publish error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Upload failed', details: error.message }));
    }
    return;
  }

  // Handle unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`API Sensors Worker listening on port ${PORT}`);
});
