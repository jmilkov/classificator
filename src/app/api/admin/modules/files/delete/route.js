import { unlink } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filename } = await req.json();
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = join(process.cwd(), 'workers', filename);
    await unlink(filePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete File Error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
