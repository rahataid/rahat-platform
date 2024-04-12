import { PrismaClient, Setting } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const chainSettings: Setting = {
  name: "CHAIN_SETTINGS",
  value: {
    id: process.env.CHAIN_ID,
    name: process.env.CHAIN_NAME,
    nativeCurrency: { name: process.env.CURRENCY_NAME, symbol: process.env.CURRENCY_SYMBOL, decimals: 18 },
    rpcUrls: {
      default: {
        http: [
          process.env.NETWORK_PROVIDER as string
        ]
      }
    },
    blockExplorers: {
      default: { name: "Etherscan", url: "https://etherscan.io" }
    }
  },
  isReadOnly: false,
  isPrivate: false,
  dataType: 'OBJECT',
  requiredFields: ['id', 'name', 'nativeCurrency', 'rpcUrls', 'blockExplorers']
}

async function main() {
  await prisma.setting.upsert({
    where: {
      name: 'CHAIN_SETTINGS'
    },
    // @ts-ignore
    create: chainSettings,
    // @ts-ignore
    update: chainSettings
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

