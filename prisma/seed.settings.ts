import { Prisma, PrismaClient, Setting, SettingDataType } from '@prisma/client';

const prisma = new PrismaClient();

const settings: Setting[] = [
  {
    value: {
      HOST: 'smtp.gmail.com',
      PORT: 465,
      SECURE: true,
      USERNAME: process.env.SMTP_USER,
      PASSWORD: process.env.SMTP_PASSWORD,
    } as Prisma.JsonValue,
    isPrivate: true,
    isReadOnly: true,
    name: 'SMTP',
    requiredFields: ['HOST', 'PORT', 'SECURE', 'USERNAME', 'PASSWORD'],
    dataType: SettingDataType.OBJECT,
  },
];

async function main() {
  await prisma.setting.createMany({
    // @ts-ignore
    data: settings,
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

// Run this script with:
// npx ts-node prisma/seed.settings.ts
