import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';

const execAsync = promisify(exec);

export async function GET(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Process name is required' }, { status: 400 });
  }

  try {
    const { stdout } = await execAsync(`pm2 logs ${name} --lines 100 --nostream --raw`);
    return NextResponse.json({ logs: stdout });
  } catch (error) {
    console.error('PM2 Logs Error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
