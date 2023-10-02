import { PrismaClient, Role } from '@prisma/client';
import { hexStringToBuffer } from '../src/utils/string-format';

const prisma = new PrismaClient();

async function seed() {
  // Create users
  const user1 = await prisma.user.create({
    data: {
      name: 'Raghav - Admin',
      email: 'rahat@mailinator.com',
      walletAddress: hexStringToBuffer(
        '0xAC6bFaf10e89202c293dD795eCe180BBf1430d7B',
      ),
      roles: [Role.ADMIN],
      isActive: true,
    },
  });
  const user2 = await prisma.user.create({
    data: {
      name: 'Raghav - Donor',
      email: 'rahatuser@mailinator.com',
      walletAddress: hexStringToBuffer(
        '0x30418a5C1C1Fd8297414F596A6C7B3bb8F7B4b7d',
      ),
      isActive: true,

      roles: [Role.ADMIN],
    },
  });
  const user3 = await prisma.user.create({
    data: {
      name: 'Stakeholder',
      email: 'stake@mailinator.com',
      walletAddress: hexStringToBuffer(
        '0x216EC842b77e424671219ABB817467fCEa991404',
      ),
      roles: [Role.STAKEHOLDER],
      isActive: true,
    },
  });

  console.log({
    user1,
    user2,
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
