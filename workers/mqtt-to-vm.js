/**
 * @description Воркер для передачи метрик из MQTT в VictoriaMetrics (InfluxDB Line Protocol).
 * Распаковывает вложенные JSON-данные, извлекает timestamp и отправляет в базу.
 */
import mqtt from 'mqtt';
import 'dotenv/config';
import axios from 'axios';

// ---- НАСТРОЙКИ ----
const MQTT_URL = process.env.MQTT_URL || 'mqtt://ovpn.techmon.ru:3883';
const MQTT_USER = process.env.MQTT_USER || "main";
const MQTT_PASS = process.env.MQTT_PASS || "ZfeL6hkeyu2PqwBY";

// URL VictoriaMetrics
const VM_URL = process.env.VM_URL || 'http://192.168.88.12:8428';
console.log(`[mqtt-to-vm] VM_URL: ${VM_URL}`);
console.log(`[mqtt-to-vm] MQTT: ${MQTT_URL}`);

const client = mqtt.connect(MQTT_URL, {
    username: MQTT_USER,
    password: MQTT_PASS,
    reconnectPeriod: 5000,
});

// На какие топики подписываемся
const TOPICS = [
    '/v2/6/+/val'
];

client.on('connect', () => {
    console.log('[mqtt-to-vm] Успешно подключено к брокеру. Подписка на топики...');
    client.subscribe(TOPICS, (err) => {
        if (err) {
            console.error(`[mqtt-to-vm] Ошибка подписки: ${err.message}`);
        } else {
            console.log(`[mqtt-to-vm] Подписан на: ${TOPICS.join(', ')}`);
        }
    });
});

client.on('error', (err) => {
    console.error(`[mqtt-to-vm] MQTT Error: ${err.message}`);
});

client.on('message', async (topic, message) => {
    try {
        // console.log("Topic:",topic.toString(),"Message:",message.toString());
        
        const parts = topic.split('/');
        let deviceId = 'unknown';

        if (parts.length >= 4 && parts[1] === 'v2' && parts[2] === '6') {
            deviceId = parts[3];
        } else if (parts.length >= 3 && parts[1] === 'v2') {
            deviceId = parts[2];
        } else if (parts.length >= 2) {
            deviceId = parts[1];
        } else {
            deviceId = parts[parts.length - 1] || 'unknown';
        }

        const data = JSON.parse(message.toString());
        const timestamp = data.time || Math.floor(Date.now() / 1000);
        const metrics = [];

        // Обработка данных
        for (const [key, value] of Object.entries(data)) {
            if (key === 'time') continue;
            
            // Если значение — вложенный объект (например, {"data": {"temperature": 25}})
            if (typeof value === 'object' && value !== null) {
                for (const [subKey, subValue] of Object.entries(value)) {
                    if (typeof subValue === 'number' && !isNaN(subValue)) {
                        metrics.push({ name: subKey, value: subValue });
                    }
                }
            } else if (typeof value === 'number' && !isNaN(value)) {
                // Если значение — прямое число
                metrics.push({ name: key, value: value });
            }
        }

        if (metrics.length === 0) {
            return; // Нет числовых данных для отправки
        }

        // Преобразование в InfluxDB Line Protocol
        // Формат: spk3_metricName,device_id=deviceId value=123 1620000000000000000
        const lines = metrics.map(m => {
            // Метрика всегда начинается с префикса spk3_ (или используем имя напрямую, если хотите)
            // Пример: spk3_temperature,device_id=123 value=25.5 1700000000
            const tsNano = String(timestamp).length <= 10 
                ? timestamp * 1000000000 // Из секунд в наносекунды
                : timestamp * 1000000;   // Из миллисекунд в наносекунды

            return `spk3_${m.name},device_id=${deviceId} value=${m.value} ${tsNano}`;
        }).join('\n');

        // Отправка в VictoriaMetrics (InfluxDB API)
        const vmEndpoint = `${VM_URL}/write`;
        await axios.post(vmEndpoint, lines, {
            headers: { 'Content-Type': 'text/plain' },
            timeout: 5000
        });

        // logWorkerAction('mqtt-to-vm', 'Sent', `Sent ${metrics.length} metrics to VM`, null);

    } catch (err) {
        console.error(`[mqtt-to-vm] Processing error: ${err.message}. Message: ${message.toString()}`);
    }
});

client.on('connect', () => {
    console.log('[MQTT] Успешно подключено к брокеру. Подписка на топики...');
    // Подписываемся на топики, которые реально используются в проекте
    client.subscribe('#'); 
});

client.on('message', async (topic, message) => {
    try {
        const rawStr = message.toString().trim();
        // ... (остальной код остается без изменений)

        // 1. Извлекаем device_id из топика
        const parts = topic.split('/').filter(p => p.length > 0);
        let deviceId = 'unknown';

        if (parts[0] === 'v2' && parts[1] === '6' && parts[2]) {
            deviceId = parts[2];
        } else if ((parts[0] === 'client' || parts[0] === '6' || parts[0] === '5') && parts[1]) {
            deviceId = parts[1];
        } else {
            deviceId = parts[parts.length - 1] || 'unknown';
        }

        if (deviceId === 'unknown') return; // Игнорируем сообщения без четкого ID устройства


        // 2. Базовая проверка на JSON
        if (!rawStr.startsWith('{')) return;

        // Парсим верхний уровень
        let rootObj = JSON.parse(rawStr);
        let metrics = {};

        // 3. Рекурсивная распаковка объектов и исправление питоновских строк
        let timestamp = null;

        function unpack(obj) {
            for (let key in obj) {
                let val = obj[key];

                if (val === null || val === undefined) continue;
                
                // Ищем время в пакете
                if (key === 'time' || key === 'ts') {
                    if (typeof val === 'number') {
                        // Если timestamp похож на YYYYMMDDHHMMSS (14 цифр, больше 20000000000000)
                        if (val > 20000000000000) {
                            // Формат: 20260706172422 -> Парсим в Unix Timestamp
                            const tsStr = val.toString();
                            const year = parseInt(tsStr.substring(0, 4), 10);
                            const month = parseInt(tsStr.substring(4, 6), 10) - 1; // Месяцы в JS 0-11
                            const day = parseInt(tsStr.substring(6, 8), 10);
                            const hour = parseInt(tsStr.substring(8, 10), 10);
                            const min = parseInt(tsStr.substring(10, 12), 10);
                            const sec = parseInt(tsStr.substring(12, 14), 10);
                            
                            // Создаем дату (UTC или Local, зависит от того, что шлет девайс. Используем UTC как стандарт)
                            // timestamp = Math.floor(Date.UTC(year, month, day, hour, min, sec) / 1000);
                            timestamp = Date.UTC(year, month, day, hour, min, sec);

                        } else {
                            // Иначе это обычный Unix Timestamp
                            timestamp = val*1000;
                        }
                    }
                    continue;
                }

                // Если это строка, похожая на JSON
                if (typeof val === 'string' && (val.trim().startsWith('{') || val.includes("'"))) {
                    try {
                        const fixedJson = val.replace(/'/g, '"');
                        const innerObj = JSON.parse(fixedJson);
                        unpack(innerObj);
                        continue; 
                    } catch (e) {}
                }

                if (typeof val === 'object' && !Array.isArray(val)) {
                    unpack(val);
                } else {
                    let num = parseFloat(val);
                    if (!isNaN(num) && isFinite(num)) {
                        // Пропускаем служебные ключи и любые дубли, заканчивающиеся на _value
                        if (key !== 'type' && key !== 'g_ts' && !key.endsWith('_value')) {
                            metrics[key] = num;
                        }
                    }
                }
            }
        }

        unpack(rootObj);
        
        // 4. Формируем InfluxDB Line Protocol
        const fields = [];
        for (let [key, val] of Object.entries(metrics)) {
            fields.push(`${key}=${val}`);
        }

        if (fields.length > 0) {
            // Добавляем timestamp (в секундах) в конец строки, если он был найден
            const tsSuffix = timestamp ? ` ${timestamp}` : '';
            const lineProtocolData = `spk3,device_id=${deviceId} ${fields.join(',')}${tsSuffix}\n`;
            
            console.log(`[VM Debug] Device: ${deviceId}, TS: ${timestamp || 'now'}, Data: ${fields.join(',')}`);

            const baseUrl = process.env.VM_WRITE_URL || `${VM_URL}/write`;
            const vmWriteUrl = baseUrl.includes('?') ? `${baseUrl}&precision=ms` : `${baseUrl}?precision=ms`;
            // const vmWriteUrl = process.env.VM_WRITE_URL || `${VM_URL}/write`;
            const response = await fetch(vmWriteUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'text/plain',
                    ...(process.env.VM_TOKEN ? { 'Authorization': `Bearer ${process.env.VM_TOKEN}` } : {})
                },
                body: lineProtocolData
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[VM Error] Ошибка записи (${response.status}): ${response.statusText}. Ответ: ${errText}`);
            }
        }

    } catch (err) {
        // Пропускаем некорректный JSON или мусор
    }
});

client.on('error', (err) => {
    console.error('[MQTT Error] Ошибка клиента:', err);
});
