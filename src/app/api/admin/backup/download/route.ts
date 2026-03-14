import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const backupsDir = path.resolve(process.cwd(), 'backups');
    const files = await fs.readdir(backupsDir);
    const sqlFiles = files.filter((f) => /^backup_full_.*\.sql$/.test(f));
    if (sqlFiles.length === 0) {
      return new Response('No backup available', { status: 404 });
    }
    sqlFiles.sort();
    const latest = sqlFiles[sqlFiles.length - 1];
    const filePath = path.join(backupsDir, latest);
    const stat = await fs.stat(filePath);
    const file = await fs.readFile(filePath);
    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${latest}"`,
        'Content-Length': String(stat.size),
      },
    });
  } catch (e) {
    return new Response('Error generating backup download', { status: 500 });
  }
}
