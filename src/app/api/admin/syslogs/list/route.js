import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET() {
  const dirPath = path.join(process.cwd(), 'public', 'syslog');
  try {
    const files = await readdir(dirPath);
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(dirPath, filename);
        const stats = await stat(filePath);
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
    );
    return NextResponse.json(fileList);
  } catch (err) {
    return NextResponse.json([], { status: 200 });
  }
}
