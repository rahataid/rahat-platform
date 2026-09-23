import { promises as fs } from 'fs';
import * as path from 'path';

let cached: string | null = null;

export async function getVersionFromPackageJson(): Promise<string> {
  if (cached) return cached;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf-8');
    const v = (JSON.parse(raw) as { version?: string }).version;
    if (v) {
      cached = v.startsWith('v') ? v : `v${v}`;
      return cached;
    }
  } catch {}
  cached = 'v0.0.0';
  return cached;
}
