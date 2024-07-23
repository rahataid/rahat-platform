import { PrismaClient } from '@prisma/client';
import { PrismaService, } from '@rumsan/prisma';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaService();
const prismaClient = new PrismaClient()

const projectStats = (uuid?: string) => {

    const url = process.env.BACKEND_URL

    if (!uuid) {
        return {
            "dataSources": {
                "source2": {
                    "type": "url",
                    "args": {
                        "url": `${url}/v1/beneficiaries/stats`
                    },
                    "data": []
                }
            },
            "ui": [
                [
                    {
                        "title": "Gender",
                        "type": "pie",
                        "props": {},
                        "dataSrc": "source2",
                        "dataMap": `BENEFICIARY_GENDER`,
                        "colSpan": 1,
                        "rowSpan": 2
                    }
                ],
                [
                    {
                        "title": "Beneficiary Internet Status",
                        "type": "pie",
                        "props": {},
                        "dataSrc": "source2",
                        "dataMap": `BENEFICIARY_INTERNETSTATUS`,
                        "colSpan": 1,
                        "rowSpan": 1
                    }
                ],
                [
                    {
                        "title": "Beneficiary Internet Status",
                        "type": "donut",
                        "props": {},
                        "dataSrc": "source2",
                        "dataMap": `BENEFICIARY_INTERNETSTATUS`,
                        "colSpan": 1,
                        "rowSpan": 1
                    }
                ]
            ]
        }
    }
    return {
        "dataSources": {
            "source2": {
                "type": "url",
                "args": {
                    "url": `${url}/v1/projects/${uuid}/stats`
                },
                "data": []
            }
        },
        "ui": [
            [
                {
                    "title": "Gender",
                    "type": "pie",
                    "props": {},
                    "dataSrc": "source2",
                    "dataMap": `BENEFICIARY_GENDER_ID_${uuid}`,
                    "colSpan": 1,
                    "rowSpan": 2
                },
                {
                    "title": "Genders",
                    "type": "bar",
                    "props": {},
                    "dataSrc": "source2",
                    "dataMap": `BENEFICIARY_GENDER_ID_${uuid}`,
                    "colSpan": 1,
                    "rowSpan": 1
                }
            ],
            [
                {
                    "title": "Beneficiary Internet Status",
                    "type": "donut",
                    "props": {},
                    "dataSrc": "source2",
                    "dataMap": `BENEFICIARY_INTERNETSTATUS_ID_${uuid}`,
                    "colSpan": 1,
                    "rowSpan": 1
                }
            ]
        ]
    }

}

const main = async () => {

    const projectUUID = process.argv[2];

    await prismaClient.stats.create({
        data: {
            name: `DASHBOARD_SOURCE_${projectUUID}`,
            data: projectStats(),
            group: `source_${projectUUID}`
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


