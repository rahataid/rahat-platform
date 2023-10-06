import { PrismaClient, Role } from '@prisma/client';
import { hexStringToBuffer } from '../src/utils/string-format';

const prisma = new PrismaClient();

async function seed() {
  // Create users
  const user1 = await prisma.user.create({
    data: {
      name: 'Raghav - Admin',
      email: 'raghav.kattel@rumsan.com',
      walletAddress: hexStringToBuffer(
        '0xAC6bFaf10e89202c293dD795eCe180BBf1430d7B',
      ),
      roles: [Role.ADMIN],
      isActive: true,
    },
  });

  console.log({
    user1,
  });
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
