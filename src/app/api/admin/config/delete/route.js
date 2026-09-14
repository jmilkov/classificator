import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');
  if (!filename) return NextResponse.json({ error: 'Filename required' }, { status: 400 });

  const filePath = path.join(process.cwd(), 'public', 'config', filename);
  try {
    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Ошибка при удалении файла' }, { status: 500 });
  }
}
