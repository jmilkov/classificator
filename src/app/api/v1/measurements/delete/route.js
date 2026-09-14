import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'config', 'measurements.json');
    
    const fileData = await fs.readFile(filePath, 'utf-8');
    const measurements = JSON.parse(fileData);
    
    const filtered = measurements.filter(m => m.id !== id);
    
    await fs.writeFile(filePath, JSON.stringify(filtered, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete measurement' }, { status: 500 });
  }
}
