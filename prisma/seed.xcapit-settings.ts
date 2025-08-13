import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@rumsan/prisma';

const prisma = new PrismaService();
const prismaClient = new PrismaClient();

const main = async () => {
    try {
        await prismaClient.setting.create({
            data: {
                name: "XCAPIT",
                dataType: "OBJECT",
                "value": {
                    "URL": "https://qa.ltw.xcapit.com",
                    "TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJhaGF0QHhjYXBpdC5jb20iLCJpYXQiOjE3NTQ5OTc1MjksImV4cCI6MTc1NTA4MzkyOX0.ef3QOBggtDdm0bKERNu8cR7wjIx5TYIwBAIc1JVL-VA"
                },
                requiredFields: ["URL", "TOKEN"]
            }
        })
        console.log('xcapit settings created successfully');
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
