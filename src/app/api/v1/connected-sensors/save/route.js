import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const sensor = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'config', 'connected_sensors.json');
    
    let sensors = [];
    try {
        const fileData = await fs.readFile(filePath, 'utf-8');
        sensors = JSON.parse(fileData);
    } catch {
        // file doesn't exist yet, start with empty
    }
    
    const index = sensors.findIndex(s => s.id === sensor.id);
    if (index !== -1) {
      sensors[index] = sensor;
    } else {
      sensor.id = sensor.id || Date.now().toString();
      sensors.push(sensor);
    }
    
    await fs.writeFile(filePath, JSON.stringify(sensors, null, 2));
    return NextResponse.json({ success: true, sensor });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save sensor' }, { status: 500 });
  }
}
