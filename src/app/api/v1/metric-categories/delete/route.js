import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'config', 'metric_categories.json');
    
    const fileData = await fs.readFile(filePath, 'utf-8');
    let categories = JSON.parse(fileData);
    
    categories = categories.filter(c => c.id !== id);
    
    await fs.writeFile(filePath, JSON.stringify(categories, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
