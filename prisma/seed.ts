import { PrismaClient, Role } from '@prisma/client';
import { hexStringToBuffer } from '../src/utils/string-format';

const prisma = new PrismaClient();

async function seed() {
  // Create users
  const user1 = await prisma.user.create({
    data: {
      name: 'Donor',
      email: 'donor@mailinator.com',
      walletAddress: hexStringToBuffer(
        '0x422416b9203de06be4487D17DD1C76725c6049d7',
      ),
      roles: [Role.DONOR],
      isActive: true,
    },
  });
  const user2 = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@mailinator.com',
      walletAddress: hexStringToBuffer(
        '0x216EC842b77e424671219ABB817467fCEa991409',
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
