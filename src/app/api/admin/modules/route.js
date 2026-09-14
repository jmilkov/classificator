import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { getSession } from '@/utils/auth';
import { readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

async function getModuleDescription(name) {
  try {
    const filePath = join(process.cwd(), 'workers', `${name}.js`);
    let content;
    try {
      content = await readFile(filePath, 'utf8');
    } catch {
      return { text: 'Описание недоступно', noRestart: false };
    }
    
    // Ищем описание в формате @description
    const match = content.match(/@description\s+(.*)/i);
    const noRestart = content.toLowerCase().includes('@no-restart');
    return { text: match ? match[1].replace('*/', '').trim() : 'Нет описания', noRestart };
  } catch {
    return { text: 'Описание недоступно', noRestart: false };
  }
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { stdout } = await execAsync('pm2 jlist');
    let jsonString = stdout.trim();
    const startIndex = jsonString.indexOf('[');
    if (startIndex === -1) {
      throw new Error('PM2 output format error');
    }
    jsonString = jsonString.substring(startIndex);
    const processes = JSON.parse(jsonString);

    const modules = await Promise.all(processes.map(async p => {
      const info = await getModuleDescription(p.name);
      return {
        name: p.name,
        status: p.pm2_env.status,
        cpu: p.monit.cpu,
        memory: p.monit.memory,
        uptime: p.pm2_env.pm_uptime ? Math.floor((Date.now() - p.pm2_env.pm_uptime) / 1000) : 0,
        pm_id: p.pm_id,
        restarts: p.pm2_env.restart_time,
        description: info.text,
        noRestart: info.noRestart
      };
    }));

    return NextResponse.json(modules);
  } catch (error) {
    console.error('PM2 Error:', error);
    return NextResponse.json({ error: 'Failed to fetch PM2 status. Is PM2 installed?' }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, name } = await req.json();

    if (!['start', 'stop', 'restart', 'delete', 'save'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'save') {
      await execAsync('pm2 save');
      return NextResponse.json({ success: true });
    }

    if (action === 'start' && name.endsWith('.js')) {
      const filePath = join(process.cwd(), 'workers', name);
      const content = await readFile(filePath, 'utf8');
      const noRestart = content.includes('@no-restart');
      
      const restartFlag = noRestart ? '--no-autorestart' : '';
      await execAsync(`pm2 start workers/${name} --name ${name.replace('.js', '')} ${restartFlag}`);
    } else {
      await execAsync(`pm2 ${action} "${name}"`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PM2 Action Error:', error);
    return NextResponse.json({ error: 'Failed to execute PM2 action' }, { status: 500 });
  }
}
