import { PrismaClient } from '@prisma/client';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';

const prisma = new PrismaClient();
const prismaService = new PrismaService();
const settings = new SettingsService(prismaService);

export const seedPaymentProvider = async () => {
    const url = process.env.PAYMENT_PROVIDER_URL || 'https://api-offramp-dev.rahat.io/v1';

    try {
        const dataSource = await settings.getPublic('OFFRAMP_SETTINGS');

        if (dataSource) {
            console.log('OFFRAMP_SETTINGS already exists');
            await settings.delete('OFFRAMP_SETTINGS');
            console.log('Old OFFRAMP_SETTINGS deleted');
        }
        const paymentProviderValue = {
            url,
            accessToken: 'sk_test_1234567890',
        };

        await settings.create({
            name: 'OFFRAMP_SETTINGS',
            value: paymentProviderValue,
            isPrivate: false,
        });
    } catch (error) {
        const paymentProviderValue = {
            url,
            accessToken: 'sk_test_1234567890',
        };

        await settings.create({
            name: 'OFFRAMP_SETTINGS',
            value: paymentProviderValue,
            isPrivate: false,
        });
    }
};

// Keep the standalone execution capability for when run directly
if (require.main === module) {
    seedPaymentProvider()
        .then(async () => {
            await prisma.$disconnect();
        })
        .catch(async (error) => {
            console.log(error);
            await prisma.$disconnect();
        });
}