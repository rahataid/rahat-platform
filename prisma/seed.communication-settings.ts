import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@rumsan/prisma';

const prisma = new PrismaService();
const prismaClient = new PrismaClient();

const main = async () => {
  try {
    await prismaClient.setting.create({
      data: {
        name: "COMMUNICATION",
        dataType: "OBJECT",
        value: {
          URL: "https://connect.rumsan.net/v1",
          APP_ID: "cm378lkmm0ctrsahfcw0iy3kz"
        },
        requiredFields: ["URL", "APP_ID"]
      }
    })
    console.log('comms settings created successfully');
  } catch (error) {
    console.error('Error creating setting:', error);
  } finally {

    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
