import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(req) {
  const { action, name } = await req.json();
  try {
    if (action === 'start') {
      await execPromise(`pm2 start workers/${name}`);
    } else if (action === 'stop') {
      await execPromise(`pm2 stop ${name.replace('.js', '')}`);
    } else if (action === 'restart') {
      await execPromise(`pm2 restart ${name.replace('.js', '')}`);
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
