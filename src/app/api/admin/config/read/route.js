import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');
  if (!filename) return NextResponse.json({ error: 'Filename required' }, { status: 400 });

  const filePath = path.join(process.cwd(), 'public', 'config', filename);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return new NextResponse(content);
  } catch (err) {
    return NextResponse.json({ error: 'Ошибка чтения файла' }, { status: 500 });
  }
}
