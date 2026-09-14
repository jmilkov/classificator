import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'connected-sensors');

const deleteFile = async (url) => {
  if (!url) return;
  const filename = url.split('/').pop();
  if (!filename) return;
  try {
    await fs.unlink(path.join(uploadDir, filename));
  } catch {
  }
};

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'config', 'connected_sensors.json');
    
    const fileData = await fs.readFile(filePath, 'utf-8');
    const sensors = JSON.parse(fileData);
    
    const sensor = sensors.find(s => s.id === id);
    if (sensor) {
      if (Array.isArray(sensor.schemaImages)) {
        await Promise.all(sensor.schemaImages.map(img => deleteFile(img.url)));
      } else {
        await deleteFile(sensor.schemaImage);
      }
      if (Array.isArray(sensor.manualPdf)) {
        await Promise.all(sensor.manualPdf.map(pdf => deleteFile(pdf.url)));
      } else {
        await deleteFile(sensor.manualPdf);
      }
    }
    
    const updated = sensors.filter(s => s.id !== id);
    
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete sensor' }, { status: 500 });
  }
}
