import { PrismaClient, Setting } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const chainSettings: Setting = {
  name: 'CHAIN_SETTINGS',
  value: {
    chainId: process.env.CHAIN_ID,
    name: process.env.CHAIN_NAME,
    type: process.env.CHAIN_TYPE || 'evm', // Default to EVM if not specified
    rpcUrl: process.env.NETWORK_PROVIDER as string,
    explorerUrl: process.env.BLOCK_EXPLORER_URL || 'https://etherscan.io',
    currency: {
      name: process.env.CURRENCY_NAME,
      symbol: process.env.CURRENCY_SYMBOL,
    },
  },
  isReadOnly: false,
  isPrivate: false,
  dataType: 'OBJECT',
  requiredFields: ['chainId', 'name', 'type', 'rpcUrl', 'currency'],
};

const subgraphSettings: Setting = {
  name: 'SUBGRAPH_URL',
  value: process.env.SUBGRAPH_URL || '',
  isReadOnly: false,
  isPrivate: false,
  dataType: 'STRING',
  requiredFields: [],
};

async function main() {
  await prisma.setting.upsert({
    where: {
      name: 'CHAIN_SETTINGS',
    },
    // @ts-ignore
    create: chainSettings,
    // @ts-ignore
    update: chainSettings,
  });

  await prisma.setting.upsert({
    where: {
      name: 'SUBGRAPH_URL',
    },
    // @ts-ignore
    create: subgraphSettings,
    // @ts-ignore
    update: subgraphSettings,
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
