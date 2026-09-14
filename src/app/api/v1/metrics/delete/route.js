import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'config', 'metrics.json');
    const data = await fs.readFile(filePath, 'utf8');
    let metrics = JSON.parse(data);

    metrics = metrics.filter((m) => m.id !== id);

    await fs.writeFile(filePath, JSON.stringify(metrics, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete metric' }, { status: 500 });
  }
}
