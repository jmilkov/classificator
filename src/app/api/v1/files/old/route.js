import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const oldDir = path.join(process.cwd(), 'public', 'old');
    
    // Получаем список файлов
    const files = await readdir(oldDir);
    
    // Формируем детальный список
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(oldDir, filename);
        const stats = await stat(filePath);
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
          url: `/old/${filename}`
        };
      })
    );

    return NextResponse.json(fileList);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list old files' }, { status: 500 });
  }
}
