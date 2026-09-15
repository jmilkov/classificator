import { NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'connected-sensors');

export async function GET(request, { params }) {
  const { slug } = await params;
  const filePath = path.join(uploadDir, slug);
  console.log('[file] request:', slug);

  const safe = await access(filePath).then(() => true).catch(() => false);
  if (!safe) {
    console.log('[file] NOT FOUND, looking at:', filePath);
    return new NextResponse('File not found', { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(slug).toLowerCase();
    const mime = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    }[ext] || 'application/octet-stream';

    console.log('[file] serving:', filePath, 'size:', buffer.length, 'mime:', mime);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `inline; filename="${slug}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[file] error:', error.message);
    return new NextResponse('File read error', { status: 500 });
  }
}