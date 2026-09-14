import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workersPath = join(process.cwd(), 'workers');

  try {
    const files = await readdir(workersPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    
    const filesWithMeta = await Promise.all(jsFiles.map(async (filename) => {
      let description = '';
      try {
        const content = await readFile(join(workersPath, filename), 'utf8');
        const match = content.match(/\*\s*@description\s+(.*)/i) || content.match(/\/\/\s*description:\s*(.*)/i);
        if (match) description = match[1].trim();
      } catch (e) {}
      
      return { filename, description };
    }));

    return NextResponse.json(filesWithMeta);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list workers' }, { status: 500 });
  }
}
