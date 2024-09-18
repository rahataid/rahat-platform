import { PrismaService } from '@rumsan/prisma';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaService();



const main = async () => {
    // const addGulariya = await prisma.beneficiaryGroupProject.create({
    //     data: {
    //         beneficiaryGroupId: "5d6db16a-06ee-4ec9-91ce-18a8d6fc6300",
    //         projectId: "a7995736-3a72-4e09-9ef1-8d1126d24b8c"
    //     }
    // })

    // const benfs = fs.readFileSync("removeids.json", "utf-8")

    // const parsed = JSON.parse(benfs)

    // console.log(parsed.length)

    // await prisma.beneficiaryProject.deleteMany({
    //     where: {
    //         projectId: "0faccd68-aa5c-44e2-9d1f-1ce40a3999f6",
    //         beneficiaryId: {
    //             in: parsed
    //         }
    //     }
    // })

    // 0faccd68-aa5c-44e2-9d1f-1ce40a3999f6
    const gulariyaBenfs = await prisma.beneficiaryProject.findMany({
        where: {
            projectId: "0faccd68-aa5c-44e2-9d1f-1ce40a3999f6"
        }
    })

    // const benfGroups = await prisma.beneficiaryGroupProject.findMany({
    //     where: {
    //         projectId: "0faccd68-aa5c-44e2-9d1f-1ce40a3999f6"
    //     }
    // })

    console.log(gulariyaBenfs.length)
};

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
