import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  
  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'public', 'unmapped', filename);

  // Prevent directory traversal
  if (!filePath.startsWith(path.join(process.cwd(), 'public', 'unmapped'))) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  try {
    const ext = filename.toLowerCase().split('.').pop();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

    if (isImage) {
      const content = await readFile(filePath);
      let contentType = 'image/jpeg';
      if (ext === 'png') contentType = 'image/png';
      if (ext === 'gif') contentType = 'image/gif';
      if (ext === 'webp') contentType = 'image/webp';
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': contentType,
        },
      });
    }

    const content = await readFile(filePath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
