import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  try {
    const files = await fs.readdir(uploadsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const fileData = await Promise.all(jsonFiles.map(async (filename) => {
      const filePath = path.join(uploadsDir, filename);
      const stats = await fs.stat(filePath);
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
      };
    }));

    return new Response(JSON.stringify(fileData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to read directory' }), { status: 500 });
  }
}
