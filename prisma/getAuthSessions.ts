import { PrismaClient } from '@prisma/client';
import { PrismaService, } from '@rumsan/prisma';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaService();
const prismaClient = new PrismaClient()


const main = async () => {


    const getAuth = await prismaClient.authSession.findMany({

        include: {
            Auth: {
                include: {
                    User: true
                }
            }
        }

    });

    console.log(...getAuth)


};


main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });