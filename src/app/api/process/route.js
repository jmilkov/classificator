import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function parseFileContent(content) {
  let combinedJson = {};
  const lines = content.split(/\r?\n/);
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.includes("{") && line.includes("}")) {
      try {
        const startIdx = line.indexOf("{");
        const data = JSON.parse(line.substring(startIdx));
        Object.assign(combinedJson, data);
      } catch (e) {}
    }
  }
  return combinedJson;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { searchId } = body;
    let filesInfo = {};

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const unmappedDir = path.join(process.cwd(), 'public', 'unmapped');

    const dirs = [uploadDir, unmappedDir];
    let matchedFiles = [];

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        matchedFiles.push(...files.filter(f => f.includes(searchId)).map(f => ({ dir, fname: f })));
      }
    }

    for (const { dir, fname } of matchedFiles) {
      const fullPath = path.join(dir, fname);
      const content = fs.readFileSync(fullPath, 'utf8');
      const mtime = fs.statSync(fullPath).mtimeMs;
      const combinedJson = parseFileContent(content);

      if (Object.keys(combinedJson).length > 0) {
        const dt = new Date(mtime).toISOString().replace('T', ' ').substring(0, 19);
        filesInfo[`${path.basename(dir)}/${fname}`] = { date: dt, data: combinedJson };
      }
    }

    return NextResponse.json({ filesInfo });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
