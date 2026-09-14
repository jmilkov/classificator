import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const firmwareDir = path.join(process.cwd(), 'public', 'firmware');
    const files = await readdir(firmwareDir);
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const stats = await stat(path.join(firmwareDir, filename));
        return { name: filename, size: stats.size, createdAt: stats.birthtime };
      })
    );
    return NextResponse.json(fileList);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
