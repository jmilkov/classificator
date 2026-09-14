import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const measurement = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'config', 'measurements.json');
    
    let measurements = [];
    try {
        const fileData = await fs.readFile(filePath, 'utf-8');
        measurements = JSON.parse(fileData);
    } catch (e) {
        // file might not exist yet
    }
    
    const index = measurements.findIndex(m => m.id === measurement.id);
    
    // Проверка уникальности префикса
    if (measurements.some(m => m.prefix === measurement.prefix && m.id !== measurement.id)) {
        return NextResponse.json({ error: 'Измерение с таким префиксом уже существует' }, { status: 400 });
    }

    if (index !== -1) {
      measurements[index] = measurement;
    } else {
      measurement.id = measurement.id || Date.now().toString();
      measurements.push(measurement);
    }
    
    await fs.writeFile(filePath, JSON.stringify(measurements, null, 2));
    return NextResponse.json({ success: true, measurement });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save measurement' }, { status: 500 });
  }
}
