import { Prisma, PrismaClient, Setting, SettingDataType } from '@prisma/client';

const prisma = new PrismaClient();

const settings: Setting[] = [
  {
    value: {
      host: 'smtp.gmail.com',
      Port: 465,
      secure: true,
      username: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
    } as Prisma.JsonValue,
    isPrivate: true,
    isReadOnly: true,
    name: 'SMTP',
    requiredFields: ['host', 'port', 'secure', 'username', 'password'],
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
