/**
 * @description Синхронизация метаданных хостов из Zabbix в VictoriaMetrics.
 * Получает список хостов, инвентарь и макросы, формирует Line Protocol и отправляет в базу.
 * @no-restart
 */
import 'dotenv/config';
import axios from 'axios';
import { pool } from '../src/utils/db.js';
import { logWorkerAction } from '../lib/logger.js';

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
      method: method,
      params: params,
      auth: auth,
      id: 1
    }, { timeout: 10000 });
    return response.data.result;
  } catch (error) {
    logWorkerAction('zabbix-metadata-sync', 'Error', `Zabbix API Error: ${error.message}`);
    throw error;
  }
}

async function syncMetadata() {
  logWorkerAction('zabbix-metadata-sync', 'Started', 'Starting Zabbix metadata sync...');
  try {
    const { url, user, pass } = await getZabbixSettings();
    if (!url) throw new Error('Zabbix URL missing');
    const login = await zabbixApi(url, 'user.login', { user, password: pass });
    
    const hosts = await zabbixApi(url, 'host.get', {
      selectInventory: 'extend',
      selectMacros: 'extend',
      selectGroups: 'extend',
      output: ['host', 'name']
    }, login);

    const auth = (process.env.VM_USER && process.env.VM_PASSWORD) ? {
      username: process.env.VM_USER,
      password: process.env.VM_PASSWORD
    } : undefined;

    const lines = hosts.map(host => {
      const cleanHost = String(host.host || host.hostid).replace(/[^a-zA-Z0-9_]/g, '_');
      
      // Все текстовые данные кладем в ТЕГИ (tags)
      const tags = [`host=${cleanHost}`];
      
      const displayName = String(host.name || '').replace(/ /g, '\\ ').replace(/,/g, '\\,').replace(/=/g, '\\=').replace(/\n/g, ' ');
      tags.push(`name=${displayName}`);

      // Добавляем группы хоста как тег groups (через запятую)
      if (host.groups && host.groups.length > 0) {
        const groupNames = host.groups.map(g => g.name).join('|');
        const cleanGroups = String(groupNames).replace(/ /g, '\\ ').replace(/,/g, '\\,').replace(/=/g, '\\=').replace(/\n/g, ' ');
        tags.push(`groups=${cleanGroups}`);
      }

      if (host.inventory) {
        Object.entries(host.inventory).forEach(([k, v]) => {
          if (v && k !== 'name') {
            const cleanVal = String(v).replace(/ /g, '\\ ').replace(/,/g, '\\,').replace(/=/g, '\\=').replace(/\n/g, '\\n').replace(/\r/g, '');
            tags.push(`${k}=${cleanVal}`);
          }
        });
      }
      
      // Поля (fields), куда кладем числовые значения макросов, а также наше dummy value
      const fields = ['value=1'];

      if (host.macros) {
        host.macros.forEach(macro => {
          const cleanKey = macro.macro.replace(/[^a-zA-Z0-9_]/g, '_');
          const value = parseFloat(macro.value);
          if (!isNaN(value)) {
            fields.push(`${cleanKey}=${value}`);
          }
        });
      }

      return `zabbix_metadata,${tags.join(',')} ${fields.join(',')}`;
    });

    if (lines.length > 0) {
      try {
        await axios.post(process.env.VM_WRITE_URL || 'http://192.168.88.12:8428/write', lines.join('\n'), { auth });
        logWorkerAction('zabbix-metadata-sync', 'Success', `Synced ${lines.length} hosts`);
      } catch (err) {
        logWorkerAction('zabbix-metadata-sync', 'Error', `VM API Error: ${err.response?.data || err.message}`);
      }
    }
  } catch (e) {
    logWorkerAction('zabbix-metadata-sync', 'Error', `Sync failed: ${e.message}`);
  }
}

syncMetadata();
