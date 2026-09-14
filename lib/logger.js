import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'public', 'syslog');
const CONFIG_PATH = path.join(process.cwd(), 'public', 'config', 'serial_num_spk3.json');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFilePath() {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `sensors-${date}.log`);
}

function getDeviceId(serial) {
  if (!serial) return 'unknown';
  
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const serialMap = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      
      // Ищем по ключу как есть
      if (serialMap[serial]) return serialMap[serial];
      
      // Ищем с префиксом SPK3- если его нет
      const prefixedSerial = serial.startsWith('SPK3-') ? serial : `SPK3-${serial}`;
      if (serialMap[prefixedSerial]) return serialMap[prefixedSerial];
      
      // Ищем без префикса, если он есть
      const unprefixedSerial = serial.replace(/^SPK3-/i, '');
      if (serialMap[unprefixedSerial]) return serialMap[unprefixedSerial];
    }
  } catch (err) {
    console.error('Failed to read serial_num_spk3.json for logging:', err.message);
  }
  
  return 'unknown';
}

export function logWorkerAction(workerName, action, details = '', serial = null) {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').split('.')[0];
  
  let logMessage = `[${timestamp}] Worker: ${workerName} | Action: ${action}`;
  
  if (serial) {
    const deviceId = getDeviceId(serial);
    logMessage += ` | Serial: ${serial} | DeviceId: ${deviceId}`;
  }
  
  if (details) {
    logMessage += ` | Details: ${details}`;
  }
  
  logMessage += '\n';
  
  const filePath = getLogFilePath();
  
  fs.appendFile(filePath, logMessage, (err) => {
    if (err) console.error('Failed to write to syslog:', err);
  });
  
  // Also log to console so PM2 captures it
  console.log(logMessage.trim());
}

export function logSensorRequest(req, endpoint, serial, filename = null) {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').split('.')[0];
  
  // Try to get IP address from headers or connection
  const ip = req.headers?.get('x-forwarded-for') || 
             req.headers?.get('x-real-ip') || 
             'Unknown IP';
             
  const deviceId = getDeviceId(serial);
             
  let logMessage = `[${timestamp}] IP: ${ip} | Endpoint: ${endpoint} | Serial: ${serial || 'N/A'} | DeviceId: ${deviceId}`;
  
  if (filename) {
    logMessage += ` | File: ${filename}`;
  }
  
  logMessage += '\n';
  
  const filePath = getLogFilePath();
  
  // Use appendFile for non-blocking file write
  fs.appendFile(filePath, logMessage, (err) => {
    if (err) console.error('Failed to write to syslog:', err);
  });
}