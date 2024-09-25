import { PrismaClient } from '@prisma/client';
import { PrismaService, } from '@rumsan/prisma';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaService();
const prismaClient = new PrismaClient()

const data =
{
  URL: "https://connect.rumsan.net/api/v1",
  APP_ID: "cm0uy35h2035e10ax58lf5mvj"
}


const main = async () => {

  await prismaClient.setting.create({
    data: {
      value: data as object,
      isPrivate: false,
      isReadOnly: false,
      name: 'COMMUNICATION',
      dataType: 'OBJECT',

      requiredFields: ["URL", "APP_ID"],
    }
  });
};


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
