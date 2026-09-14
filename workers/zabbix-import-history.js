/**
 * @description Получение истории из Zabbix и отправка её в VictoriaMetrics по всем хостам и их метрикам.
 */
import 'dotenv/config';
import axios from 'axios';
import { pool } from '../src/utils/db.js';
import { logWorkerAction } from '../lib/logger.js';

const START_DAYS_AGO = 60; // За какой период с текущего момента мы начинаем парсить
const CHUNK_HOURS = 2; // Окно парсинга (2 часа)

async function getZabbixSettings() {
  const result = await pool.query("SELECT key, value FROM app_config WHERE key IN ('zabbixUrl', 'zabbixUser', 'zabbixPassword')");
  const settings = {};
  result.rows.forEach(row => { settings[row.key] = row.value; });
  return {
    url: settings.zabbixUrl,
    user: settings.zabbixUser,
    pass: settings.zabbixPassword
  };
}

async function zabbixApi(url, method, params, auth = null) {
  try {
    const response = await axios.post(url, {
      jsonrpc: '2.0',
      method,
      params,
      auth,
      id: 1
    }, { timeout: 30000 });
    return response.data.result;
  } catch (err) {
    logWorkerAction('zabbix-import-history', 'Error', `Zabbix API Error: ${err.message}`);
    throw err;
  }
}

// ... rest of the file ...
async function main() {
  logWorkerAction('zabbix-import-history', 'Started', 'Zabbix Import Worker started');
  try {
    const settings = await getZabbixSettings();
    if (!settings.url) {
        logWorkerAction('zabbix-import-history', 'Warning', 'Zabbix URL not set');
        return;
    }
    const login = await zabbixApi(settings.url, 'user.login', { user: settings.user, password: settings.pass });
    
    // Получаем хосты
    const hosts = await zabbixApi(settings.url, 'host.get', {
      output: ['hostid', 'host'],
      selectMacros: ['macro', 'value'],
      search: { host: 'СПК' }
    }, login);

    for (let i = 0; i < hosts.length; i++) {
      logWorkerAction('zabbix-import-history', 'Processing', `Processing host ${hosts[i].host} [${i + 1}/${hosts.length}]`);
      await processHost(settings, login, hosts[i]);
    }

    logWorkerAction('zabbix-import-history', 'Finished', 'All done');
  } catch (err) {
    logWorkerAction('zabbix-import-history', 'Error', err.message);
  }
}

main();
