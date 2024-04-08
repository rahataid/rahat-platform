import { Prisma, PrismaClient, Setting, SettingDataType } from '@prisma/client';

const prisma = new PrismaClient();

const settings: Setting = {
    value: {
        privateKey: process.env.PRIVATE_KEY
    } as Prisma.JsonValue,
    isPrivate: true,
    isReadOnly: true,
    name: 'DEV',
    requiredFields: ['privateKey'],
    dataType: SettingDataType.OBJECT,
}

async function main() {
    await prisma.setting.upsert({
        where: {
            name: 'DEV'
        },
        // @ts-ignore
        create: settings,
        // @ts-ignore
        update: settings
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });