import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  const workersPath = join(process.cwd(), 'workers');

  if (filename) {
    try {
      const filePath = join(workersPath, filename);
      const fileContent = await readFile(filePath);
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'application/javascript',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to read worker file' }, { status: 404 });
    }
  }

  try {
    const files = await readdir(workersPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    
    return NextResponse.json(jsFiles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list workers' }, { status: 500 });
  }
}
