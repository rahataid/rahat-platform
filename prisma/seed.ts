import { PrismaClient } from '@prisma/client';
import { hexStringToBuffer } from '../src/utils/string-format';

const prisma = new PrismaClient();

async function seed() {
  const roles1 = await prisma.role.create({
    data: {
      name: 'Donor',
    },
  });
  const roles2 = await prisma.role.create({
    data: {
      name: 'Field Agent',
    },
  });
  const roles3 = await prisma.role.create({
    data: {
      name: 'Vendors',
    },
  });
  const roles4 = await prisma.role.create({
    data: {
      name: 'Stakeholders',
    },
  });

  // Create users
  const user1 = await prisma.user.create({
    data: {
      name: 'User 1',
      email: 'user1@rahat.com',
      walletAddress: hexStringToBuffer(
        '0x422416b9203de06be4487D17DD1C76725c6049d7',
      ),
      roles: {
        connect: {
          id: roles1.id,
        },
      },
    },
  });
  const user2 = await prisma.user.create({
    data: {
      name: 'User 2',
      email: 'user2@rahat.com',
      walletAddress: hexStringToBuffer(
        '0x216EC842b77e424671219ABB817467fCEa991409',
      ),
      roles: {
        connect: {
          id: roles2.id,
        },
      },
    },
  });
  const user3 = await prisma.user.create({
    data: {
      name: 'User 3',
      email: 'user3@rahat.com',
      walletAddress: hexStringToBuffer(
        '0x216EC842b77e424671219ABB817467fCEa991404',
      ),
      roles: {
        connect: {
          id: roles3.id,
        },
      },
    },
  });
  const user4 = await prisma.user.create({
    data: {
      name: 'User 4',
      email: 'user4@rahat.com',
      walletAddress: hexStringToBuffer(
        '0x456EC842b77e424671219ABB817467fCEa991404',
      ),
      roles: {
        connect: {
          id: roles4.id,
        },
      },
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
