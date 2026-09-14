import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import path from 'node:path';

const DB_PATH = process.env.DB_PATH || './data/voice_alert.db';

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;

  try {
    console.log('[DB Init] Checking / creating tables...');
    const d = getDb();

    d.exec(`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        groupid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS call_media_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        media_type_id TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        group_id TEXT,
        call_media_type_id INTEGER REFERENCES call_media_types(id) ON DELETE SET NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    const row = d.prepare('SELECT COUNT(*) AS cnt FROM users').get();
    const count = row.cnt;

    if (count === 0) {
      console.log('[DB Init] Creating default user...');
      const passHash = hashPassword('api_voice123');
      d.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('api_voice', passHash, 'admin');
      console.log('[DB Init] Default user "api_voice" created with admin role.');
    } else {
      const adminRow = d.prepare("SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'").get();
      const adminCount = adminRow.cnt;
      if (adminCount === 0) {
        console.log('[DB Init] No admin users found. Setting first user as admin...');
        d.prepare("UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users ORDER BY id ASC LIMIT 1)").run();
      }
    }

    isInitialized = true;
    console.log('[DB Init] Database is ready.');
  } catch (error) {
    console.error('[DB Init Error] Failed to initialize database:', error);
  }
}

initDb().catch(console.error);

export function query(text, params = []) {
  const start = Date.now();
  try {
    const d = getDb();
    const isSelect = text.trim().toUpperCase().startsWith('SELECT');
    let res;
    if (isSelect) {
      res = d.prepare(text).all(...params);
    } else {
      const info = d.prepare(text).run(...params);
      res = { rowCount: info.changes, rows: [] };
    }
    const duration = Date.now() - start;
    console.log('[DB Query]', { text, duration, rows: isSelect ? res.length : res.rowCount });
    return res;
  } catch (error) {
    console.error('[DB Query Error]', { text, error: error.message });
    throw error;
  }
}

export { getDb as pool };