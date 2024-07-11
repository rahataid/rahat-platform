import { PrismaClient } from '@prisma/client';
import { PrismaService, } from '@rumsan/prisma';
import { SettingsService } from '@rumsan/settings';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaService();
const settings = new SettingsService(prisma);
const prismaClient = new PrismaClient()

const navJSON = {
    data: [
        {
            title: 'Dashboard',
            path: '/dashboard'
        },
        {
            title: 'Project',
            path: '/projects'
        },
        {
            title: 'Beneficiaries',
            path: '/beneficiary'
        },
        {
            title: 'Communications',
            path: '/communications/text'

        }
    ],

    subData: [
        {
            title: 'Vendors',
            path: '/vendors',
        },
        {
            title: 'Users',
            path: '/users',
        },
    ],
};

const main = async () => {
    // const settingsData: Setting = {
    //   value: navJSON as Prisma.JsonValue,
    //   isPrivate: true,
    //   isReadOnly: true,
    //   name: 'NAV_SETTINGS',

    //   requiredFields: [],
    //   dataType: 'OBJECT',
    // };

    await prismaClient.setting.create({
        data: {
            value: navJSON as object,
            isPrivate: false,
            isReadOnly: true,
            name: 'NAV_SETTINGS',
            dataType: 'OBJECT',

            requiredFields: ['data', 'subData'],
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