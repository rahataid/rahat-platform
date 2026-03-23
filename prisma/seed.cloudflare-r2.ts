import { PrismaClient, Setting, SettingDataType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cloudflareR2Settings: Setting = {
    name: 'CLOUDFLARE_R2',
    value: {
      R2_BUCKET: process.env.R2_BUCKET || '',
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    dataType: SettingDataType.OBJECT,
    requiredFields: [
      'R2_BUCKET',
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
    ],
    isReadOnly: false,
    isPrivate: true,
  };

  await prisma.setting.upsert({
    where: { name: 'CLOUDFLARE_R2' },
    create: cloudflareR2Settings,
    update: cloudflareR2Settings,
  });

  console.log('CLOUDFLARE_R2 settings seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
