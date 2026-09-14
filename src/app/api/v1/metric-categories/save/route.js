import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const category = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'config', 'metric_categories.json');
    
    const fileData = await fs.readFile(filePath, 'utf-8');
    const categories = JSON.parse(fileData);
    
    // Simple ID generation or update logic
    const index = categories.findIndex(c => c.id === category.id);
    
    // Проверка уникальности префикса
    if (categories.some(c => c.prefix === category.prefix && c.id !== category.id)) {
        return NextResponse.json({ error: 'Категория с таким префиксом уже существует' }, { status: 400 });
    }

    if (index !== -1) {
      categories[index] = category;
    } else {
      category.id = category.id || Date.now().toString();
      categories.push(category);
    }
    
    await fs.writeFile(filePath, JSON.stringify(categories, null, 2));
    return NextResponse.json({ success: true, category });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save category' }, { status: 500 });
  }
}
