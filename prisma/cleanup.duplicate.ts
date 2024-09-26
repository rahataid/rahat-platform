import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const groups = await prisma.tempGroup.findMany({});
    for (let g of groups) {
        const rows = await prisma.tempBeneficiaryGroup.findMany({
            where: {
                tempGroupUID: g.uuid
            }, include: {
                tempBeneficiary: true
            }
        });
        await sanitizeAndSave(g.name, rows);
    }
}

async function sanitizeAndSave(groupName: string, rows: any[]) {
    const benefUIDs: any = await splitAndCombineDuplicateBenef(rows);
    const group = await prisma.beneficiaryGroup.create({
        data: { name: groupName }
    });
    const mapped = benefUIDs.map((b: any) => {
        return {
            beneficiaryGroupId: group.uuid,
            beneficiaryId: b
        }
    });
    await prisma.groupedBeneficiaries.createMany({
        data: mapped
    });
    console.log(`==${mapped.length} beneficiaries added to group ${groupName}==`);
}

async function splitAndCombineDuplicateBenef(rows: any[]) {
    const duplicates: any = [];
    const nonDuplicates: any = [];
    for (const r of rows) {
        let benef: any = r.tempBeneficiary;
        const found = await findPiiByPhone(benef.phone);
        if (found) {
            const row: any = await findByBeneId(found.beneficiaryId);
            duplicates.push(row.uuid);
        } else {
            const row: any = await addBeneficiaryAndPii(benef);
            nonDuplicates.push(row.uuid);
        }
    }
    return [...duplicates, ...nonDuplicates];
}

async function addBeneficiaryAndPii(beneficiary: any) {
    const { name, phone, email, ...rest } = beneficiary;
    const b = await prisma.beneficiary.create({
        data: { ...rest }
    });
    return prisma.beneficiaryPii.create({
        data: {
            name,
            phone,
            email,
            beneficiaryId: b.id, extras: {
                govtIDNumber: rest.govtIDNumber || '',
            }
        }
    });
}

async function findByBeneId(id: number) {
    return prisma.beneficiary.findUnique({
        where: {
            id
        }
    })
}

async function findPiiByPhone(phone: string) {
    return prisma.beneficiaryPii.findUnique({
        where: {
            phone: phone
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





