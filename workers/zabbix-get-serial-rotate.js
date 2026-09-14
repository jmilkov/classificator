/**
 * @description Разово. Экспорт SERIAL и ROTATE всех SPK3 устройств в конфигурационные файлы.
 * @no-restart
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { pool } from '../src/utils/db.js';
import { config } from '../src/config/index.js';
import { logWorkerAction } from '../lib/logger.js';

const OUTPUT_DIR = path.join(process.cwd(), 'public/config');
const SERIAL_FILENAME = path.join(OUTPUT_DIR, 'serial_num_spk3.json');
const ROTATE_FILENAME = path.join(OUTPUT_DIR, 'rotate_photo.json');

async function getZabbixSettings() {
  const result = await pool.query("SELECT key, value FROM app_config");
  const settings = {};
  result.rows.forEach(row => { settings[row.key] = row.value; });
  
  return {
    url: settings.zabbix_url || config.zabbixUrl,
    user: settings.zabbix_user || config.zabbixUser,
    pass: settings.zabbix_password || config.zabbixPassword
  };
}

async function zabbixRequest(token, url, method, params) {
  const payload = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    auth: token,
    id: Date.now()
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (data.error) throw new Error(`Zabbix Error: ${JSON.stringify(data.error)}`);
  return data.result;
}

async function login(url, user, pass) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "user.login",
      params: { user, password: pass },
      id: 1,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.data || "Ошибка авторизации в Zabbix");
  return data.result;
}

async function exportData(token, url) {
  logWorkerAction('zabbix-get-serial-rotate', 'Info', 'Старт экспорта серийных номеров и ротаций');
  try {
    const macros = await zabbixRequest(token, url, 'usermacro.get', {
      selectHosts: 'extend',
      output: ['value', 'macro'],
    });

    const serialMap = {};
    const rotateList = [];

    macros.forEach(m => {
      const hostName = m.hosts?.[0]?.host;
      if (!hostName) return;

      if (m.macro === "{$SERIAL_NUM}") {
        serialMap[m.value] = hostName;
      } else if (m.macro === "{$CAM_ROTATE}" && m.value === '1') {
        rotateList.push(hostName);
      }
    });

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(SERIAL_FILENAME, JSON.stringify(serialMap, null, 2), 'utf-8');
    await fs.writeFile(ROTATE_FILENAME, JSON.stringify(rotateList, null, 2), 'utf-8');
    
    logWorkerAction('zabbix-get-serial-rotate', 'Success', 'Данные сохранены в public/config/');
  } catch (error) {
    logWorkerAction('zabbix-get-serial-rotate', 'Error', `Ошибка экспорта: ${error.message}`);
  }
}

async function main() {
  logWorkerAction('zabbix-get-serial-rotate', 'Started', 'Starting one-time export task');
  try {
    const { url, user, pass } = await getZabbixSettings();
    const token = await login(url, user, pass);
    await exportData(token, url);
  } catch (error) {
    logWorkerAction('zabbix-get-serial-rotate', 'Error', `Ошибка: ${error.message}`);
  } finally {
    logWorkerAction('zabbix-get-serial-rotate', 'Finished', 'Worker exiting');
    process.exit();
  }
}

main();