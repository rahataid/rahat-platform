import { PrismaClient } from '@prisma/client';
import { PrismaService, } from '@rumsan/prisma';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const prisma = new PrismaService();
const prismaClient = new PrismaClient()


const main = async () => {


    const getAuth = await prismaClient.userRole.findMany({
        where: {
            Role: {
                name: 'Admin',
            },
        },

        include: {
            User: {
                include: {
                    Auth: {
                        include: {
                            AuthLog: true
                        }
                    },
                }
            }
        }

    });

    console.log(...getAuth)

    const formattedData = getAuth.map((data) => {
        return {
            userName: data.User.name,
            email: data.User.email,

            logins: [
                ...data.User.Auth.map((auth) => {
                    return {
                        type: auth.service,
                        lastLogedInd: auth.lastLoginAt,
                        logs: [
                            ...auth.AuthLog.map((log) => {
                                return {
                                    createdAt: log.createdAt,
                                    ip: log.ip,
                                    userAgent: log.userAgent
                                }
                            })
                        ]

                    }
                })
            ]
        }
    }
    );

    console.log(...formattedData);

    fs.writeFile('authSessions.json', JSON.stringify(formattedData, null, 2), (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('Successfully wrote authSessions.json');
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