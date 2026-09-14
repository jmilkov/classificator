import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { logSensorRequest } from '../../../../../../lib/logger';

export async function GET(request, { params }) {
  const filename = request.nextUrl.pathname.split('/').pop();
  const { searchParams } = new URL(request.url);
  const serial = searchParams.get('serial') || 'unknown';

  logSensorRequest(request, `/api/files/firmware/${filename}`, serial, filename);

  try {
    const filePath = path.join(process.cwd(), 'public', 'firmware', filename);
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
