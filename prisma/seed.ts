import { PrismaClient, Role } from '@prisma/client';
import { hexStringToBuffer } from '../src/utils/string-format';

const prisma = new PrismaClient();

async function seed() {
  // Create users
  const user1 = await prisma.user.create({
    data: {
      name: 'Raghav - Admin',
      email: 'raghav.kattel@rumsan.net',
      walletAddress: hexStringToBuffer(
        '0xAC6bFaf10e89202c293dD795eCe180BBf1430d7B',
      ),
      roles: [Role.ADMIN],
      isActive: true,
      isApproved: true,
    },
  });
  const user2 = await prisma.user.create({
    data: {
      name: 'Shristi K',
      email: 'shristi.khayargoli@agriclear.io',
      walletAddress: hexStringToBuffer(
        '0x0fC030C2b2b8E466B4a2779E780978e7ee5a406F',
      ),
      roles: [Role.ADMIN],
      isActive: true,
      isApproved: true,
    },
  });
  const user3 = await prisma.user.create({
    data: {
      name: 'Ashmita- Rumsan',
      email: 'ashmita@rahat.io',
      walletAddress: hexStringToBuffer(
        '0xf14da5a200e614b9b6bd3903d0c6bd4f7bb61ca2',
      ),
      roles: [Role.ADMIN],
      isActive: true,
      isApproved: true,
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
