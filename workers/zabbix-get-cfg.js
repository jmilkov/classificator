/**
 * @description Разово. Экспорт конфигураций _cfg.json SPK3 устройств в downloads.
 * @no-restart
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { pool } from '../src/utils/db.js';
import { config } from '../src/config/index.js';
import { logWorkerAction } from '../lib/logger.js';

const OUTPUT_DIR = path.join(process.cwd(), 'public/downloads');
const MACRO_SERIAL = "{$SERIAL_NUM}";

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

async function exportConfigs(token, url) {
  logWorkerAction('zabbix-get-cfg', 'Started', 'Старт экспорта конфигураций хостов');
  try {
    const macros = await zabbixRequest(token, url, 'usermacro.get', {
      output: ['hostid', 'value', 'macro'],
      selectHosts: ['hostid'],
      filter: { macro: MACRO_SERIAL }
    });

    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    for (const m of macros) {
      const serial = m.value;
      const hostId = m.hostid;

      const hostData = await zabbixRequest(token, url, 'host.get', {
        hostids: [hostId],
        output: ['host']
      });

      const allMacros = await zabbixRequest(token, url, 'usermacro.get', {
        hostids: [hostId],
        output: ['macro', 'value', 'hostid']
      });

      const configData = {};
      configData['HOST'] = hostData[0]?.host || 'unknown';

      allMacros.forEach(item => {
        const cleanMacro = item.macro.replace(/^\{\$/, '').replace(/\}$/, '');
        const val = item.value;
        const num = parseFloat(val);
        configData[cleanMacro] = !isNaN(num) && String(num) === val ? num : val;
      });

      const cleanSerial = serial.replace(/^SPK3-/i, '');
      const filename = `SPK3-${cleanSerial}_cfg.json`;
      await fs.writeFile(path.join(OUTPUT_DIR, filename), JSON.stringify(configData, null, 2), 'utf-8');
    }
    
    logWorkerAction('zabbix-get-cfg', 'Success', `Экспорт завершен. Всего файлов: ${macros.length}`);
  } catch (error) {
    logWorkerAction('zabbix-get-cfg', 'Error', `Ошибка экспорта: ${error.message}`);
  }
}

async function main() {
  logWorkerAction('zabbix-get-cfg', 'Init', 'Starting worker');
  try {
    const { url, user, pass } = await getZabbixSettings();
    const token = await login(url, user, pass);
    await exportConfigs(token, url);
  } catch (error) {
    logWorkerAction('zabbix-get-cfg', 'Error', `Ошибка: ${error.message}`);
  } finally {
    process.exit();
  }
}

main();
