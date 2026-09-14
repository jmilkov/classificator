import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  const { filename, content } = await req.json();
  if (!filename || content === undefined) return NextResponse.json({ error: 'Filename and content required' }, { status: 400 });

  const filePath = path.join(process.cwd(), 'public', 'config', filename);
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Ошибка сохранения файла' }, { status: 500 });
  }
}
