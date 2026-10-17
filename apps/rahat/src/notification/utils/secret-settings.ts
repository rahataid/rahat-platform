// rahat-platform/apps/rahat/src/notification/utils/secret-settings.ts  (NEW)
import { PrismaService } from '@rumsan/prisma';

/** Reads a STRING setting straight from the DB (includes isPrivate rows). Falls back to env. */
export async function getSecretSetting(
    prisma: PrismaService,
    name: string,
    envFallback?: string,
): Promise<string | null> {
    try {
        const row = await prisma.setting.findUnique({ where: { name } });
        const v = row?.value;
        if (typeof v === 'string' && v.trim()) return v.trim();
    } catch {
        /* fall through to env */
    }
    return envFallback?.trim() || null;
}