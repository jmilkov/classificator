import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const downloadDir = path.join(process.cwd(), 'public', 'downloads');
    
    // Получаем список файлов
    const files = await readdir(downloadDir);
    
    // Формируем детальный список
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(downloadDir, filename);
        const stats = await stat(filePath);
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
          url: `/downloads/${filename}`
        };
      })
    );

    return NextResponse.json(fileList);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list download files' }, { status: 500 });
  }
}
