import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';

const execPromise = util.promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execPromise('pm2 jlist');
    let jsonString = stdout.trim();
    const startIndex = jsonString.indexOf('[');
    if (startIndex === -1) {
      throw new Error('PM2 output format error');
    }
    jsonString = jsonString.substring(startIndex);
    const processes = JSON.parse(jsonString);
    
    const workersDir = path.join(process.cwd(), 'workers');
    const workerFiles = await fs.readdir(workersDir);
    
    const workerDetails = await Promise.all(workerFiles.map(async (file) => {
        if (!file.endsWith('.js')) return null;
        const filePath = path.join(workersDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const descriptionMatch = content.match(/\/\*\*[\s\S]*?@description\s+([\s\S]*?)\*\//);
        const description = descriptionMatch ? descriptionMatch[1].replace(/\n\s*\*/g, '').trim() : 'No description';
        
        const proc = processes.find(p => p.name === file || p.name === file.replace('.js', ''));
        
        return {
            name: file,
            description,
            status: proc ? proc.pm2_env.status : 'stopped',
            pid: proc ? proc.pid : null
        };
    }));

    return Response.json(workerDetails.filter(w => w !== null));
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to fetch workers info' }, { status: 500 });
  }
}
