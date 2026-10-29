// rahat-platform/prisma/seed.push-settings.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl: process.env.CORE_DATABASE_URL || process.env.DATABASE_URL,
});

interface SeedItem {
    name: string;
    envKey: string;
    isPrivate: boolean;
    validate?: (v: string) => void;
}

const ITEMS: SeedItem[] = [
    {
        name: 'FIREBASE_SERVICE_ACCOUNT_BASE64',
        envKey: 'FIREBASE_SERVICE_ACCOUNT_BASE64',
        isPrivate: true,
        validate: (v) => {
            let json: any;
            try {
                json = JSON.parse(Buffer.from(v, 'base64').toString('utf8'));
            } catch {
                throw new Error('is not valid base64-encoded JSON (re-run Step 1)');
            }
            if (json.type !== 'service_account' || !json.private_key || !json.client_email) {
                throw new Error('decoded JSON is not a Firebase service account');
            }
        },
    },
    {
        name: 'VAPID_PRIVATE_KEY',
        envKey: 'VAPID_PRIVATE_KEY',
        isPrivate: true,
        validate: (v) => {
            if (!/^[A-Za-z0-9_-]{43}$/.test(v)) throw new Error('expected a 43-char URL-safe base64 string');
        },
    },
    {
        name: 'VAPID_PUBLIC_KEY',
        envKey: 'VAPID_PUBLIC_KEY',
        isPrivate: false,
        validate: (v) => {
            if (!/^[A-Za-z0-9_-]{87}$/.test(v)) throw new Error('expected an 87-char URL-safe base64 string');
        },
    },
];

export const seedPushSettings = async () => {
    for (const item of ITEMS) {
        // strip whitespace, quotes and a stray trailing "%" copied from a zsh prompt
        const raw = (process.env[item.envKey] ?? '').trim().replace(/^["']|["']$/g, '').replace(/%$/, '');
        if (!raw) throw new Error(`${item.envKey} is missing in the environment`);

        try {
            item.validate?.(raw);
        } catch (e: any) {
            throw new Error(`${item.envKey} ${e.message}`);
        }

        // upsert → safe to re-run (also how you rotate keys later)
        await prisma.setting.upsert({
            where: { name: item.name },
            update: {
                value: raw,
                dataType: 'STRING' as any,
                requiredFields: [],
                isReadOnly: true,
                isPrivate: item.isPrivate,
            },
            create: {
                name: item.name,
                value: raw,
                dataType: 'STRING' as any,
                requiredFields: [],
                isReadOnly: true,
                isPrivate: item.isPrivate,
            },
        });
        console.log(`✔ seeded ${item.name} (private=${item.isPrivate})`); // never log the value
    }
};

if (require.main === module) {
    seedPushSettings()
        .then(() => prisma.$disconnect())
        .catch(async (err) => {
            console.error('✗ Seed failed:', err.message);
            await prisma.$disconnect();
            process.exit(1);
        });
}