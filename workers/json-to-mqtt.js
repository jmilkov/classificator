/**
 * @description Обработка JSON,LOG файлов из uploads, проверки по серийнику и публикации в MQTT.
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import mqtt from 'mqtt';
import { logWorkerAction } from '../lib/logger.js';

const UPLOADS_PATH = path.join(process.cwd(), 'public/uploads');
const OLD_PATH = path.join(process.cwd(), 'public/old');
const UNMAPPED_PATH = path.join(process.cwd(), 'public/unmapped');
const SYSLOGS_PATH = path.join(process.cwd(), 'public/syslog');
const SERIAL_MAP_PATH = path.join(process.cwd(), 'public/config/serial_num_spk3.json');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://ovpn.techmon.ru:3883';
const MQTT_USER = process.env.MQTT_USER || "main";
const MQTT_PASS = process.env.MQTT_PASS || "ZfeL6hkeyu2PqwBY";

const client = mqtt.connect(MQTT_URL, {
  username: MQTT_USER,
  password: MQTT_PASS
});

client.on('connect', () => {
  logWorkerAction('json-to-mqtt', 'Connected', 'MQTT Broker connected successfully');
});
client.on('error', (err) => {
  logWorkerAction('json-to-mqtt', 'Error', `MQTT Error: ${err.message}`);
});

async function getSerialMapping() {
  try {
    const data = await fs.readFile(SERIAL_MAP_PATH, 'utf-8');
    return JSON.parse(data); // { "SN123": "HostName" }
  } catch (err) {
    logWorkerAction('json-to-mqtt', 'Error', `Ошибка чтения serial_num_spk3.json: ${err.message}`);
    return {};
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processFiles() {
  try {
    const files = await fs.readdir(UPLOADS_PATH);
    const mapping = await getSerialMapping();

    for (const file of files) {
      const filePath = path.join(UPLOADS_PATH, file);
      
      // Автоматический перенос логов в syslog (вместо old)
      if (file.endsWith('.log')) {
        await fs.mkdir(SYSLOGS_PATH, { recursive: true });
        await fs.rename(filePath, path.join(SYSLOGS_PATH, file));
        logWorkerAction('json-to-mqtt', 'Moved', `Лог-файл ${file} перемещен в syslog`);
        continue;
      }

      if (!file.endsWith('.json')) continue;

      // Имя файла: SPK3-SERIAL_TS.json или SERIAL_TS.json
      const serial = file.split('_')[0].replace(/^SPK3-/i, '');
      const hostName = mapping[serial] || mapping[`SPK3-${serial}`];

      if (hostName) {
        logWorkerAction('json-to-mqtt', 'Processing', `Найден серийник. Файл: ${file}`, serial);
        
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split(/\r?\n/).filter(line => line.trim());
          
          let sentCount = 0;
          for (const line of lines) {
            const json = JSON.parse(line);
            const moduleType = json.type || 'data';
            
            // Удаляем type из данных, чтобы он не дублировался
            const payloadData = { ...json };
            delete payloadData.type;

            // Формируем payload согласно шаблону
            const ts = json.ts ? Math.floor(json.ts) : Math.floor(Date.now() / 1000);
            const payload = JSON.stringify({
              time: ts,
              [moduleType]: payloadData
            });

            const topic = `/v2/6/${hostName}/val`;
            client.publish(topic, payload);
            sentCount++;
            
            await sleep(500); // Задержка 0.5 сек
          }

          logWorkerAction('json-to-mqtt', 'Published', `Отправлено ${sentCount} строк в MQTT`, serial);

          await fs.mkdir(OLD_PATH, { recursive: true });
          await fs.rename(filePath, path.join(OLD_PATH, file));
        } catch (err) {
          logWorkerAction('json-to-mqtt', 'Error', `Ошибка обработки файла ${file}: ${err.message}`, serial);
        }
      } else {
        logWorkerAction('json-to-mqtt', 'Unmapped', `Устройство не найдено в маппинге. Файл: ${file}`, serial);
        await fs.mkdir(UNMAPPED_PATH, { recursive: true });
        await fs.rename(filePath, path.join(UNMAPPED_PATH, file));
      }
    }
  } catch (err) {
    logWorkerAction('json-to-mqtt', 'Error', `Ошибка цикла обработки: ${err.message}`);
  }
}

logWorkerAction('json-to-mqtt', 'Started', 'Worker is running');
setInterval(processFiles, 5000);

