import { NextResponse } from 'next/server';
import { rename, stat } from 'fs/promises';
import path from 'path';

export async function POST(request, { params }) {
  const { filename } = await params;
  const unmappedDir = path.join(process.cwd(), 'public', 'unmapped');
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  try {
    const sourcePath = path.join(unmappedDir, filename);
    const targetPath = path.join(uploadsDir, filename);

    // Verify source exists
    await stat(sourcePath);

    await rename(sourcePath, targetPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reprocess error:', error);
    return NextResponse.json({ error: 'Failed to reprocess file' }, { status: 500 });
  }
}
