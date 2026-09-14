import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const unmappedDir = path.join(process.cwd(), 'public', 'unmapped');
    
    // Check if directory exists, if not create it or return empty
    try {
      await stat(unmappedDir);
    } catch {
      return NextResponse.json([]);
    }

    const files = await readdir(unmappedDir);
    
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(unmappedDir, filename);
        const stats = await stat(filePath);
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
          url: `/unmapped/${filename}`
        };
      })
    );

    return NextResponse.json(fileList);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list unmapped files' }, { status: 500 });
  }
}
