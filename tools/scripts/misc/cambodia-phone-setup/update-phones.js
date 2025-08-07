const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const phoneUpdates = {
    '0123456789': '0987654321',
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function updatePhones() {
    console.log("📞 Starting interactive phone update...\n");

    for (const [oldPhone, newPhone] of Object.entries(phoneUpdates)) {
        try {
            const record = await prisma.beneficiaryPii.findUnique({
                where: { phone: oldPhone },
            });

            if (!record) {
                console.warn(`⚠️  No record found with phone: ${oldPhone}\n`);
                continue;
            }

            console.log(`Found record:`);
            console.log(`  ID: ${record.beneficiaryId}`);
            console.log(`  Name: ${record.name || 'N/A'}`);
            console.log(`  Phone: ${record.phone}`);
            const answer = await askQuestion(`➡️  Update to ${newPhone}? (yes/no): `);

            if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                await prisma.beneficiaryPii.update({
                    where: { phone: oldPhone },
                    data: { phone: newPhone },
                });
                console.log(`✅ Updated: ${oldPhone} → ${newPhone}\n`);
            } else {
                console.log(`⏭️  Skipped: ${oldPhone}\n`);
            }

        } catch (err) {
            console.error(`❌ Error with ${oldPhone}:`, err);
        }
    }

    rl.close();
    await prisma.$disconnect();
}

updatePhones();
