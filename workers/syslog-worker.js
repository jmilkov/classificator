/**
 * @description Очистка старых логов (старше 30 дней) каждый день. Ротация реализована в lib/logger.js
 */
import fs from 'fs';
import path from 'path';
import { logWorkerAction } from '../lib/logger.js';

const LOG_DIR = path.join(process.cwd(), 'public', 'syslog');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function cleanupOldLogs() {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  fs.readdir(LOG_DIR, (err, files) => {
    if (err) {
      logWorkerAction('syslog-worker', 'Error', `Failed to read log directory: ${err.message}`);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(LOG_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          logWorkerAction('syslog-worker', 'Error', `Failed to stat file ${file}: ${err.message}`);
          return;
        }

        if (now - stats.mtimeMs > thirtyDaysMs) {
          fs.unlink(filePath, err => {
            if (err) {
              logWorkerAction('syslog-worker', 'Error', `Failed to delete old log file ${file}: ${err.message}`);
            } else {
              logWorkerAction('syslog-worker', 'Cleanup', `Deleted old log file: ${file}`);
            }
          });
        }
      });
    });
  });
}

// Run cleanup once on startup
cleanupOldLogs();

// Then run every 24 hours
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);

// Keep the process running
logWorkerAction('syslog-worker', 'Started', 'Running cleanup every 24 hours');


