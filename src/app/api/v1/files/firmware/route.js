import { NextResponse } from 'next/server';
import { readdir, stat, writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

const firmwareDir = path.join(process.cwd(), 'public', 'firmware');

export async function GET() {
  try {
    await mkdir(firmwareDir, { recursive: true });
    const files = await readdir(firmwareDir);
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const stats = await stat(path.join(firmwareDir, filename));
        return { name: filename, size: stats.size, createdAt: stats.birthtime, url: `/api/files/firmware/${filename}` };
      })
    );
    return NextResponse.json(fileList);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    await mkdir(firmwareDir, { recursive: true });
    await writeFile(path.join(firmwareDir, file.name), buffer);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { filename } = await request.json();
    await unlink(path.join(firmwareDir, filename));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
