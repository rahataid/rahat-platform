import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const prabhu = {
    provider: "prabhu",
    url: "https://connect.rumsan.net/api/v1/broadcasts",
    token: "cm0dfcrpu018tbka65dwalzrl",
    appId: "gdw9i6lrezuedxzlvl4h4h74",
    message: "Hi, your OTP is ${otp} and the amount is ${amount}"
}

async function main() {
    await prisma.setting.create({
        data: {
            name: 'SMS_SETTINGS',
            value: [
                prabhu
            ],
            isReadOnly: false,
            isPrivate: false,
            dataType: 'OBJECT',
            requiredFields: []
        }
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

