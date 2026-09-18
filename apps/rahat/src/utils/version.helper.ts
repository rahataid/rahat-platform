import { Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

let cached: string | null = null;

// Returns the app version from package.json, cached for the process lifetime.
export async function getVersionFromPackageJson(): Promise<string> {
    if (cached) return cached;
    const candidates = [
        path.join(process.cwd(), 'package.json'),        // pnpm dev
        path.join(__dirname, '../../package.json'),      // dist/apps/rahat/src/app -> dist/apps/rahat
        path.join(__dirname, '../../../package.json'),
    ];
    for (const p of candidates) {
        try {
            const raw = await fs.readFile(p, 'utf-8');
            const v = JSON.parse(raw).version as string | undefined;
            if (v) {
                cached = String(v).startsWith('v') ? String(v) : `v${v}`;
                Logger.log(`Version loaded ${cached} from ${p}`, 'VersionHelper');
                return cached;
            }
        } catch {
            // candidate path not found, try next
        }
    }
    cached = 'v0.0.0';
    Logger.warn('Version fallback v0.0.0 — package.json not found in any candidate', 'VersionHelper');
    return cached;
}
