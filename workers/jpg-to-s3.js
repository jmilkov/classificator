/**
 * @description Обработка JPG файлов из uploads, проверки по серийнику и публикации в S3 хранилище.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { parse, format } from 'date-fns';
import { S3Client, PutObjectCommand, HeadObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { logWorkerAction } from '../lib/logger.js';

// Пути
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const OLD_DIR = path.join(process.cwd(), "public", "old");
const UNMAPPED_DIR = path.join(process.cwd(), "public", "unmapped");
const CONFIG_PATH = path.join(process.cwd(), "public", "config", "serial_num_spk3.json");
const ROTATE_CONFIG_PATH = path.join(process.cwd(), "public", "config", "rotate_photo.json");

// S3 Конфигурация
const s3Client = new S3Client({
    region: "ru1",
    endpoint: process.env.S3_URL,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true,
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function loadJSON(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        logWorkerAction('jpg-to-s3', 'Error', `Error loading ${filePath}: ${e.message}`);
        return null;
    }
}

async function processImage(filePath, fileName, serialNum, deviceId, rotate) {
    let data_created = format(new Date(), "yyyy-MM-dd HH:mm:ss");

    // Извлечение даты из имени файла
    try {
        const parts = fileName.split('_');
        
        if (parts.length > 1) {
            const datePart = parts[1].split('.')[0];
            
            if (datePart.length === 14) {
                const parsedDate = parse(datePart, "yyyyMMddHHmmss", new Date());
                if (!isNaN(parsedDate.getTime())) {
                    data_created = format(parsedDate, "yyyy-MM-dd HH:mm:ss");
                }
            } else {
                const date = new Date(parseInt(datePart) * 1000);
                if (!isNaN(date.getTime())) {
                    data_created = format(date, "yyyy-MM-dd HH:mm:ss");
                }
            }
        }
    } catch (e) {
        logWorkerAction('jpg-to-s3', 'Error', `Error parsing date from filename: ${e.message}`);
    }

    const svgText = `
    <svg width="300" height="70">
        <style>
            .bg { fill: rgba(65, 29, 29, 0.66); }
            .text { font-family: 'DejaVu Sans', sans-serif; font-size: 16px; fill: white; }
        </style>
        <rect x="15" y="15" width="220" height="45" class="bg" />
        <text x="20" y="33" class="text">${serialNum}</text>
        <text x="20" y="53" class="text">${data_created}</text>
    </svg>`;

    let pipeline = sharp(filePath);
    
    if (rotate) {
        pipeline = pipeline.rotate(180);
    }
    
    pipeline = pipeline.composite([{ input: Buffer.from(svgText), top: 5, left: 5 }]);

    const buffer = await pipeline.toBuffer();

    // Отправка в S3
    await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: `${serialNum}/${fileName}`,
        Body: buffer,
        ContentType: "image/jpeg"
    }));

    await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: `${serialNum}/last.jpg`,
        Body: buffer,
        ContentType: "image/jpeg"
    }));

    try {
        await s3Client.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: `${serialNum}/last.jpg` }));
        await s3Client.send(new CopyObjectCommand({
            Bucket: process.env.S3_BUCKET,
            CopySource: `${process.env.S3_BUCKET}/${serialNum}/last.jpg`,
            Key: `${serialNum}/pre-last.jpg`
        }));
    } catch (e) {
        // last.jpg не существует
    }
    
    logWorkerAction('jpg-to-s3', 'Uploaded', `Uploaded ${fileName} to S3 (rotate: ${rotate})`, serialNum);
}

async function runWorker() {
    if (!fs.existsSync(OLD_DIR)) fs.mkdirSync(OLD_DIR, { recursive: true });
    if (!fs.existsSync(UNMAPPED_DIR)) fs.mkdirSync(UNMAPPED_DIR, { recursive: true });

    const serialMap = await loadJSON(CONFIG_PATH) || {};
    const rotateList = await loadJSON(ROTATE_CONFIG_PATH) || [];

    if (!fs.existsSync(UPLOADS_DIR)) return;
    const files = fs.readdirSync(UPLOADS_DIR);

    for (const file of files) {
        if (!file.toLowerCase().endsWith('.jpg')) continue;

        const fullPath = path.join(UPLOADS_DIR, file);
        const deviceId = file.split('_')[0];
        const serialNumFromConfig = serialMap[deviceId];

        try {
            if (serialNumFromConfig) {
                const shouldRotate = rotateList.includes(serialNumFromConfig);
                await processImage(fullPath, file, serialNumFromConfig, deviceId, shouldRotate);
                fs.unlinkSync(fullPath); 
            } else {
                logWorkerAction('jpg-to-s3', 'Unmapped', `No serial mapping. Moving to unmapped.`, deviceId);
                fs.renameSync(fullPath, path.join(UNMAPPED_DIR, file));
            }
            await sleep(500);
        } catch (err) {
            logWorkerAction('jpg-to-s3', 'Error', `Error processing ${file}: ${err.message}`);
        }
    }
}

// Запуск
logWorkerAction('jpg-to-s3', 'Started', 'Worker is running');
setInterval(runWorker, 5000);
