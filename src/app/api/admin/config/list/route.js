import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dirPath = path.join(process.cwd(), 'public', 'config');
  try {
    const files = fs.readdirSync(dirPath);
    return NextResponse.json(files);
  } catch (err) {
    return NextResponse.json([], { status: 200 });
  }
}
