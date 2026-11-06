import { PrismaClient, Setting } from '@prisma/client';
import { Keypair } from '@stellar/stellar-sdk';
import 'dotenv/config';

const prisma = new PrismaClient();

const NAME = 'STELLAR_CORE_SPONSOR_SETTINGS';

async function main() {
  const sponsorSecret = process.env.STELLAR_CORE_SPONSOR_SECRET;
  if (!sponsorSecret) throw new Error('STELLAR_CORE_SPONSOR_SECRET environment variable is required');
  const sponsorPublicKey = Keypair.fromSecret(sponsorSecret).publicKey();

  const setting: Setting = {
    name: NAME,
    value: {
      network: process.env.STELLAR_NETWORK ?? 'testnet',
      horizonUrl: process.env.STELLAR_HORIZON_URL,
      sponsorSecret,
      sponsorPublicKey,
    },
    isReadOnly: false,
    // private: masked on list and refused by getPublic; the secret must never reach a project
    isPrivate: true,
    dataType: 'OBJECT',
    requiredFields: ['network', 'sponsorSecret', 'sponsorPublicKey'],
  };

  // @ts-ignore
  await prisma.setting.upsert({ where: { name: NAME }, create: setting, update: setting });
  console.log(`${NAME} seeded (core sponsor public key: ${sponsorPublicKey})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
