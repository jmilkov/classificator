import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request, { params }) {
  const { filename } = await params;
  const oldDir = path.join(process.cwd(), 'public', 'old');
  const filePath = path.join(oldDir, filename);

  // Prevent directory traversal
  if (!filePath.startsWith(oldDir)) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  try {
    await unlink(filePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
