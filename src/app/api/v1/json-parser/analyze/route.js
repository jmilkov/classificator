import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const { filenames } = await request.json();
    const uploadsDir = path.join(process.cwd(), 'public/uploads');

    const results = await Promise.all(filenames.map(async (filename) => {
      const filePath = path.join(uploadsDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      try {
        return { filename, data: JSON.parse(content) };
      } catch (e) {
        return { filename, error: 'Invalid JSON' };
      }
    }));

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process files' }), { status: 500 });
  }
}
