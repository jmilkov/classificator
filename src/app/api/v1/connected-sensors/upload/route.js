import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink, access } from 'fs/promises';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'connected-sensors');

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      console.log('[upload] No file in formData');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[upload] file:', file.name, 'size:', file.size);
    const buffer = Buffer.from(await file.arrayBuffer());
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, buffer);

    const exists = await access(filePath).then(() => true).catch(() => false);
    console.log('[upload] saved to:', filePath, 'exists:', exists);

    const url = `/uploads/connected-sensors/${safeName}`;
    const uploadedAt = new Date().toISOString();
    return NextResponse.json({ success: true, url, filename: safeName, uploadedAt });
  } catch (error) {
    console.error('[upload] error:', error.message, error.stack);
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { filename } = await request.json();
    if (!filename) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
    }
    const filePath = path.join(uploadDir, filename);
    console.log('[upload] deleting:', filePath);
    await unlink(filePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[upload] delete error:', error.message);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}