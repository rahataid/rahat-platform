import { PrismaClient } from '@prisma/client';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { commonLib } from './_common';

const prismaClient = new PrismaClient({
  datasourceUrl: process.env.CORE_DATABASE_URL as string,
});

const prisma = new PrismaService();
const settings = new SettingsService(prisma);
const subGraphURL = process.argv[2];
const SETTINGS_DB_NAME = 'RP_DEV';

class SettingsSeed extends commonLib {
  constructor() {
    super();
  }

  public async addAppSettings() {
    await settings.create({
      name: 'Blockchain',
      value: {
        chainId: process.env.CHAIN_ID,
        rpcUrl: process.env.NETWORK_PROVIDER,
        chainName: process.env.CHAIN_NAME,
        networkId: process.env.NETWORK_ID,
        nativeCurrency: {
          name: process.env.CURRENCY_NAME,
          symbol: process.env.CURRENCY_SYMBOL,
        },
      },
      isPrivate: false,
    });
  }


  public async addGraphSettings() {
    const formatted = subGraphURL.substring(
      0,
      subGraphURL.indexOf('\\') !== -1 ? subGraphURL.indexOf('\\') : undefined
    );
    const formattedUrl = formatted
      ? formatted
      : 'http://localhost:8000/subgraphs/name/rahat/rp';
    await settings.create({
      name: 'Subgraph_URL',
      value: {
        url: formattedUrl,
      },
      isPrivate: false,
    });
  }
}

async function main() {
  const seedProject = new SettingsSeed();

  await seedProject.addAppSettings();
  await seedProject.addGraphSettings();

  process.exit(0);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
