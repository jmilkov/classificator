import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  try {
    const { stdout } = await execPromise(`pm2 logs ${name.replace('.js', '')} --nostream --lines 50`);
    return Response.json({ logs: stdout });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
