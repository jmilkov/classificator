import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const newMetric = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'config', 'metrics.json');
    const data = await fs.readFile(filePath, 'utf8');
    const metrics = JSON.parse(data);

    const index = metrics.findIndex((m) => m.id === newMetric.id);
    if (index > -1) {
      metrics[index] = newMetric;
    } else {
      metrics.push(newMetric);
    }

    await fs.writeFile(filePath, JSON.stringify(metrics, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save metric' }, { status: 500 });
  }
}
