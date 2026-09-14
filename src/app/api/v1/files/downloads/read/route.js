import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  if (!filename) return NextResponse.json({ error: 'Missing filename' }, { status: 400 });

  try {
    const filePath = path.join(process.cwd(), 'public', 'downloads', filename);
    const content = await readFile(filePath, 'utf8');
    return new NextResponse(content);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
