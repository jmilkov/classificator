import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const model = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'config', 'hw_revision.json');
    
    let hwRevisions = [];
    try {
        const fileData = await fs.readFile(filePath, 'utf-8');
        hwRevisions = JSON.parse(fileData);
    } catch {
        // file doesn't exist yet, start with empty
    }
    
    const index = hwRevisions.findIndex(m => m.id === model.id);
    
    // Проверка уникальности префикса
    if (hwRevisions.some(m => m.prefix === model.prefix && m.id !== model.id)) {
        return NextResponse.json({ error: 'Ревизия с таким префиксом уже существует' }, { status: 400 });
    }

    if (index !== -1) {
      hwRevisions[index] = model;
    } else {
      model.id = model.id || Date.now().toString();
      hwRevisions.push(model);
    }
    
    await fs.writeFile(filePath, JSON.stringify(hwRevisions, null, 2));
    return NextResponse.json({ success: true, model });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save hw revision' }, { status: 500 });
  }
}
