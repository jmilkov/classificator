import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const { filename, content } = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'downloads', filename);
    await writeFile(filePath, content, 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}
