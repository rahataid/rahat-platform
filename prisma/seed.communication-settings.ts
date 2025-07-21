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
        "value": {
          "URL": "https://connect.rumsan.net/api/v1/broadcasts",
          "APP_ID": "cmagktyta00d8293dcdcm32qd",
          "SMS_TRANSPORT_ID": "gdw9i6lrezuedxzlvl4h4h74",
          "PROVIDER": "prabhu",
          "MESSAGE": "Hi, your OTP is ${otp} and the amount is ${amount}",
          "USE_STATIC_OTP": false,
          "STATIC_OTP": 1234,
          // Pilot
          // APP_ID: "cm1t9iuny001bsahfkjy7quia"
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
